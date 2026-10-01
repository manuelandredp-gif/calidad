import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import { pinoHttp } from 'pino-http';

import { env, getCorsOrigins, isProduction } from './config/env';
import { logger } from './common/utils/logger';
import { prisma, initDatabasePragmas, disconnectDatabase } from './config/prisma';
import { requestId } from './common/middleware/request-id';
import { apiLimiter, authLimiter, aiLimiter } from './common/middleware/rate-limit';
import { errorHandler, notFoundHandler } from './common/middleware/error-handler';
import { AIFactory } from './core/ai.factory';
import { mountSwagger } from './config/swagger';

import { authRouter } from './modules/auth/auth.router';
import { projectsRouter } from './modules/projects/projects.router';
import { requirementsRouter } from './modules/requirements/requirements.router';
import { aiGenerationRouter } from './modules/ai-generation/ai-generation.router';
import { testCasesRouter } from './modules/test-cases/test-cases.router';
import { traceabilityRouter } from './modules/traceability/traceability.router';
import { metricsRouter } from './modules/metrics/metrics.router';
import { exportRouter } from './modules/export/export.router';
import { heuristicsRouter } from './modules/heuristics/heuristics.router';

const app = express();

// Detrás de un proxy/balanceador (Railway, Render, Nginx) para IPs correctas en rate-limit.
app.set('trust proxy', 1);

// -------------------- Middlewares globales de seguridad --------------------
app.use(helmet()); // Cabeceras de seguridad (CSP, HSTS, noSniff, etc.)
app.use(compression()); // Compresión gzip de las respuestas

const corsOrigins = getCorsOrigins();
app.use(
  cors({
    origin: corsOrigins, // Allowlist explícita (o '*' solo en desarrollo)
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Trazabilidad: id por petición + logging estructurado con latencia
app.use(requestId);
app.use(
  pinoHttp({
    logger,
    genReqId: (req) => (req as Request & { id?: string }).id,
    customLogLevel: (_req, res, err) => {
      if (res.statusCode >= 500 || err) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
  })
);

// -------------------- Documentación OpenAPI / Swagger --------------------
mountSwagger(app);

// -------------------- Healthchecks --------------------
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'TestGenAI Backend Core',
    version: '1.0.0',
    environment: env.NODE_ENV,
    aiDefaultProvider: env.AI_PROVIDER_DEFAULT,
  });
});

app.get('/api/health/db', async (_req: Request, res: Response, next) => {
  try {
    const isPostgres = env.DATABASE_URL.startsWith('postgres');
    const [userCount, projectCount, reqCount, tcCount] = await Promise.all([
      prisma.user.count(),
      prisma.project.count(),
      prisma.requirement.count(),
      prisma.testCase.count(),
    ]);

    res.status(200).json({
      status: 'connected',
      engine: isPostgres ? 'PostgreSQL' : 'SQLite',
      counts: { users: userCount, projects: projectCount, requirements: reqCount, testCases: tcCount },
    });
  } catch (err) {
    next(err);
  }
});

// Healthcheck del proveedor de IA por defecto (verifica configuración de claves)
app.get('/api/health/ai', (_req: Request, res: Response) => {
  const provider = env.AI_PROVIDER_DEFAULT;
  const keyPresent =
    provider === 'gemini'
      ? Boolean(env.GEMINI_API_KEY)
      : provider === 'openai'
      ? Boolean(env.OPENAI_API_KEY)
      : true; // mock no requiere clave

  // Fuerza la instanciación del adaptador para validar que existe.
  AIFactory.getProvider(provider);

  res.status(keyPresent ? 200 : 503).json({
    provider,
    configured: keyPresent,
    fallback: 'HeuristicEngine (determinista, 0 tokens)',
    message: keyPresent
      ? `Proveedor '${provider}' configurado correctamente`
      : `Falta la API key para '${provider}'; se usará el motor heurístico de repuesto`,
  });
});

// -------------------- API REST (versionada bajo /api/v1) --------------------
const api = express.Router();
api.use('/auth', authLimiter, authRouter);
api.use('/projects', apiLimiter, projectsRouter);
api.use('/requirements', apiLimiter, requirementsRouter);
api.use('/ai', aiLimiter, aiGenerationRouter);
api.use('/heuristics', apiLimiter, heuristicsRouter);
api.use('/test-cases', apiLimiter, testCasesRouter);
api.use('/traceability', apiLimiter, traceabilityRouter);
api.use('/metrics', apiLimiter, metricsRouter);
api.use('/export', apiLimiter, exportRouter);

// Se montan las rutas en /api/v1 (nueva) y /api (alias retrocompatible).
app.use('/api/v1', api);
app.use('/api', api);

// -------------------- Frontend estático (SPA) --------------------
const frontendPath = path.resolve(__dirname, '../../frontend');
app.use(express.static(frontendPath));

// Redirección SPA solo para rutas no-API
app.get('*', (req: Request, res: Response, next) => {
  if (req.originalUrl.startsWith('/api')) return next();
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// -------------------- Manejo de errores centralizado --------------------
app.use('/api', notFoundHandler);
app.use(errorHandler);

// -------------------- Arranque y cierre elegante --------------------
if (require.main === module) {
  initDatabasePragmas().then(() => {
    const server = app.listen(env.PORT, () => {
      logger.info(
        {
          url: `http://localhost:${env.PORT}`,
          health: `http://localhost:${env.PORT}/api/health`,
          docs: `http://localhost:${env.PORT}/api/docs`,
          aiProvider: env.AI_PROVIDER_DEFAULT,
          env: env.NODE_ENV,
        },
        '🚀 TestGenAI Backend iniciado'
      );
    });

    // Cierre ordenado ante señales del sistema (evita conexiones colgadas / corrupción)
    const shutdown = async (signal: string) => {
      logger.info({ signal }, 'Cerrando servidor de forma ordenada...');
      server.close(async () => {
        await disconnectDatabase();
        logger.info('Recursos liberados. Adiós.');
        process.exit(0);
      });
      // Salida forzada si algo se cuelga
      setTimeout(() => process.exit(1), 10000).unref();
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('unhandledRejection', (reason) => {
      logger.error({ reason }, 'Promesa rechazada no controlada');
    });
    process.on('uncaughtException', (err) => {
      logger.fatal({ err }, 'Excepción no capturada; terminando proceso');
      process.exit(1);
    });
  });
}

// Marca de uso para el linter en builds de producción
void isProduction;

export default app;
