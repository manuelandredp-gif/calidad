import dotenv from 'dotenv';
import { z } from 'zod';

// Carga el archivo .env una sola vez y de forma centralizada
dotenv.config();

/**
 * Esquema de validación de variables de entorno.
 * El servidor NO arranca si falta una variable crítica o tiene un formato inválido.
 * Esto elimina fallos silenciosos en producción (p. ej. un JWT_SECRET ausente).
 */
const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),

    PORT: z.coerce.number().int().positive().default(4000),

    DATABASE_URL: z.string().min(1, 'DATABASE_URL es obligatoria'),

    // En producción exigimos un secreto fuerte (>= 32 chars) sin valor por defecto.
    JWT_SECRET: z.string().min(16, 'JWT_SECRET debe tener al menos 16 caracteres'),
    JWT_EXPIRES_IN: z.string().default('7d'),

    // Refresh tokens: secreto independiente y expiraciones diferenciadas.
    // Si no se define JWT_REFRESH_SECRET, se deriva de JWT_SECRET (ver más abajo).
    JWT_REFRESH_SECRET: z.string().optional(),
    ACCESS_TOKEN_EXPIRES_IN: z.string().default('1h'),
    REFRESH_TOKEN_EXPIRES_IN: z.string().default('30d'),

    BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),

    // Lista de orígenes permitidos para CORS, separados por coma. '*' solo en desarrollo.
    CORS_ORIGINS: z.string().default('*'),

    AI_PROVIDER_DEFAULT: z.enum(['gemini', 'openai', 'mock']).default('mock'),
    GEMINI_API_KEY: z.string().optional().default(''),
    OPENAI_API_KEY: z.string().optional().default(''),

    // Tiempo máximo (ms) para una llamada a un proveedor de IA antes de abortar.
    AI_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
    // Reintentos ante fallos transitorios de la API de IA.
    AI_MAX_RETRIES: z.coerce.number().int().min(0).max(5).default(2),
    // Presupuesto máximo de gasto de IA por proyecto (USD). 0 = sin límite.
    AI_PROJECT_BUDGET_USD: z.coerce.number().min(0).default(5),

    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),
  })
  .superRefine((val, ctx) => {
    // Refuerzo de seguridad: en producción prohibimos secretos débiles/de ejemplo y CORS abierto.
    if (val.NODE_ENV === 'production') {
      if (val.JWT_SECRET.length < 32 || val.JWT_SECRET.includes('change_in_production')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['JWT_SECRET'],
          message:
            'En producción JWT_SECRET debe ser un secreto aleatorio de >= 32 caracteres (no el valor de ejemplo).',
        });
      }
      if (val.CORS_ORIGINS.trim() === '*') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['CORS_ORIGINS'],
          message: 'En producción CORS_ORIGINS no puede ser "*"; define una lista explícita de orígenes.',
        });
      }
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.errors
    .map((e) => `  - ${e.path.join('.') || '(raíz)'}: ${e.message}`)
    .join('\n');
  // Fallo temprano y explícito: mejor no arrancar que arrancar inseguro.
  // (El logger aún no existe en este punto del arranque, por eso se usa console.)
  // eslint-disable-next-line no-console
  console.error('❌ Configuración de entorno inválida:\n' + details);
  process.exit(1);
}

export const env = parsed.data;

// El secreto de refresh cae a un derivado del principal si no se configura explícitamente.
export const JWT_REFRESH_SECRET = env.JWT_REFRESH_SECRET || `${env.JWT_SECRET}_refresh`;

export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

/** Devuelve la allowlist de orígenes CORS ya parseada. */
export function getCorsOrigins(): string[] | '*' {
  const raw = env.CORS_ORIGINS.trim();
  if (raw === '*') return '*';
  return raw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}
