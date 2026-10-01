import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../../config/prisma';
import { sendSuccess } from '../../common/utils/api-response';
import {
  authenticateJWT,
  issueTokenPair,
  verifyRefreshToken,
} from '../../common/middleware/auth.middleware';
import { asyncHandler } from '../../common/middleware/async-handler';
import { ApiError } from '../../common/errors/api-error';
import { audit } from '../../common/utils/audit';
import { env } from '../../config/env';
import { CookieSessionManager } from '../../common/security/cookie-session';

export const authRouter = Router();

// Contraseña robusta: mínimo 8 caracteres con al menos una minúscula, una mayúscula y un dígito.
const strongPassword = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .regex(/[a-z]/, 'Debe incluir al menos una letra minúscula')
  .regex(/[A-Z]/, 'Debe incluir al menos una letra mayúscula')
  .regex(/[0-9]/, 'Debe incluir al menos un dígito');

const registerSchema = z.object({
  email: z.string().email('Formato de correo inválido'),
  password: strongPassword,
  fullName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  role: z.enum(['QA_TESTER', 'QA_LEAD', 'DEVELOPER', 'ADMIN']).optional().default('QA_TESTER'),
});

const loginSchema = z.object({
  email: z.string().email('Formato de correo inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

// POST /api/auth/register
authRouter.post(
  '/register',
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password, fullName, role } = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) throw ApiError.conflict('El correo electrónico ya está registrado');

    const passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);
    const user = await prisma.user.create({
      data: { email, passwordHash, fullName, role },
      select: { id: true, email: true, fullName: true, role: true, createdAt: true },
    });

    const tokens = issueTokenPair({ userId: user.id, email: user.email, role: user.role });
    CookieSessionManager.setAuthCookie(res, tokens.accessToken);
    CookieSessionManager.setRefreshCookie(res, tokens.refreshToken);
    audit(req, 'AUTH_REGISTER', { userId: user.id, email: user.email });
    // `token` se mantiene como alias del accessToken por retrocompatibilidad del cliente.
    return sendSuccess(
      res,
      { user, token: tokens.accessToken, ...tokens },
      'Usuario registrado con éxito',
      201
    );
  })
);

// POST /api/auth/login
authRouter.post(
  '/login',
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    // Mensaje genérico idéntico para usuario inexistente o clave errónea (evita enumeración).
    if (!user) throw ApiError.unauthorized('Credenciales inválidas');

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) throw ApiError.unauthorized('Credenciales inválidas');

    const tokens = issueTokenPair({ userId: user.id, email: user.email, role: user.role });
    CookieSessionManager.setAuthCookie(res, tokens.accessToken);
    CookieSessionManager.setRefreshCookie(res, tokens.refreshToken);


    audit(req, 'AUTH_LOGIN', { userId: user.id, email: user.email });
    return sendSuccess(
      res,
      {
        user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
        token: tokens.accessToken,
        ...tokens,
      },
      'Inicio de sesión exitoso'
    );
  })
);

// POST /api/auth/refresh - Emite un nuevo access token a partir de un refresh token válido
const refreshSchema = z.object({ refreshToken: z.string().min(10, 'refreshToken requerido').optional() });

authRouter.post(
  '/refresh',
  asyncHandler(async (req: Request, res: Response) => {
    // Permite leer el refresh token desde el body o desde la cookie HttpOnly
    const bodyToken = refreshSchema.parse(req.body || {}).refreshToken;
    const reqWithCookies = req as Request & { cookies?: Record<string, string> };
    const cookieToken =
      reqWithCookies.cookies?.testgenai_refresh ||
      req.headers.cookie?.match(/testgenai_refresh=([^;]+)/)?.[1];
    const refreshToken = bodyToken || cookieToken;

    if (!refreshToken) {
      throw ApiError.unauthorized('Refresh token requerido');
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw ApiError.unauthorized('Refresh token inválido o expirado');
    }

    // Confirma que el usuario aún existe (permite invalidar tokens de usuarios eliminados).
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) throw ApiError.unauthorized('Usuario no válido');

    // Rotación de tokens: se emite un par nuevo en cada refresh.
    const tokens = issueTokenPair({ userId: user.id, email: user.email, role: user.role });
    CookieSessionManager.setAuthCookie(res, tokens.accessToken);
    CookieSessionManager.setRefreshCookie(res, tokens.refreshToken);

    return sendSuccess(res, { token: tokens.accessToken, ...tokens }, 'Token renovado');
  })
);

// POST /api/auth/logout - Cierra la sesión y limpia cookies HttpOnly
authRouter.post(
  '/logout',
  asyncHandler(async (_req: Request, res: Response) => {
    CookieSessionManager.clearAuthCookies(res);
    return sendSuccess(res, { loggedOut: true }, 'Sesión cerrada exitosamente');
  })
);

// GET /api/auth/me
authRouter.get(
  '/me',
  authenticateJWT,
  asyncHandler(async (req: Request, res: Response) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, email: true, fullName: true, role: true, createdAt: true },
    });
    if (!user) throw ApiError.notFound('Usuario no encontrado');
    return sendSuccess(res, user);
  })
);

