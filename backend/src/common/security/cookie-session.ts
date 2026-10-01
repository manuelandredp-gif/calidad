import { Response, Request } from 'express';
import { isProduction } from '../../config/env';

export const AUTH_COOKIE_NAME = 'testgenai_session';
export const REFRESH_COOKIE_NAME = 'testgenai_refresh';

export interface CookieOptions {
  maxAgeMs?: number;
}

export class CookieSessionManager {
  /**
   * Establece una cookie de sesión JWT segura con flags HttpOnly y SameSite. (Mejora #34)
   */
  static setAuthCookie(res: Response, token: string, options?: CookieOptions): void {
    const maxAge = options?.maxAgeMs || 24 * 60 * 60 * 1000; // 24 horas por defecto

    res.cookie(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge,
      path: '/',
    });
  }

  /**
   * Establece la cookie de rotación de Refresh Token.
   */
  static setRefreshCookie(res: Response, refreshToken: string): void {
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 días

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge,
      path: '/api/v1/auth/refresh',
    });
  }

  /**
   * Limpia las cookies de sesión cerrando la autenticación en el cliente.
   */
  static clearAuthCookies(res: Response): void {
    res.clearCookie(AUTH_COOKIE_NAME, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      path: '/',
    });
    res.clearCookie(REFRESH_COOKIE_NAME, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      path: '/api/v1/auth/refresh',
    });
  }

  /**
   * Extrae el token JWT desde cookies HttpOnly o desde la cabecera Authorization: Bearer.
   */
  static extractToken(req: Request): string | null {
    // 1. Intentar leer desde cookies si están parseadas
    const reqWithCookies = req as Request & { cookies?: Record<string, string> };
    if (reqWithCookies.cookies && reqWithCookies.cookies[AUTH_COOKIE_NAME]) {
      return reqWithCookies.cookies[AUTH_COOKIE_NAME];
    }


    // 2. Extraer manualmente desde cabecera Cookie si cookie-parser no está instalado
    const cookieHeader = req.headers.cookie;
    if (cookieHeader) {
      const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${AUTH_COOKIE_NAME}=([^;]+)`));
      if (match) {
        return decodeURIComponent(match[1]);
      }
    }

    // 3. Fallback retrocompatible para clientes API REST (cabecera Authorization: Bearer <token>)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.slice(7).trim();
    }

    return null;
  }
}
