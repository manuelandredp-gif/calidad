# Mejoras Implementadas — TestGenAI (v1.0 → v1.1)

**Fecha:** Septiembre 2026
**Alcance:** Endurecimiento de seguridad, robustez, calidad de código, testing, CI/CD y documentación del backend.

Este documento detalla las **40 mejoras** aplicadas sobre la base v1.0, agrupadas por categoría, con el problema original, la solución y los archivos afectados.

---

## 🔴 Seguridad crítica

| # | Mejora | Solución | Archivos |
|---|--------|----------|----------|
| 1 | `node_modules`, `.env` y la BD estaban versionados | Se creó `.gitignore` y se dejaron de rastrear (2117 archivos) | [.gitignore](../.gitignore) |
| 2 | Secretos en el repositorio (`.env`) | `.env` sacado del control de versiones; queda solo en disco local | `.gitignore`, `backend/.env.example` |
| 3 | `JWT_SECRET` con fallback embebido | Secreto obligatorio validado en arranque; sin valor por defecto | [env.ts](../backend/src/config/env.ts), [auth.middleware.ts](../backend/src/common/middleware/auth.middleware.ts) |
| 4 | IDOR: cualquiera podía leer/editar/borrar proyectos ajenos | Guards de propiedad (proyecto→requisito→caso) en todos los endpoints | [ownership.ts](../backend/src/common/utils/ownership.ts) + todos los routers |
| 5 | `CORS origin: '*'` con `Authorization` | Allowlist por `CORS_ORIGINS`; prohibido `*` en producción | [main.ts](../backend/src/main.ts), `env.ts` |
| 6 | El manejador de errores filtraba `err.message` | Manejador central: mensajes genéricos al cliente, detalle solo en logs | [error-handler.ts](../backend/src/common/middleware/error-handler.ts) |
| 7 | Sin rate limiting (fuerza bruta / abuso IA) | `express-rate-limit` por zona (auth, IA, general) | [rate-limit.ts](../backend/src/common/middleware/rate-limit.ts) |
| 8 | Sin cabeceras de seguridad | `helmet` | `main.ts` |
| 9 | Contraseña mínima de 6 sin complejidad | Mínimo 8 + mayúscula, minúscula y dígito (Zod) | [auth.router.ts](../backend/src/modules/auth/auth.router.ts) |
| 10 | Sin límite de gasto de IA | Presupuesto por proyecto (`AI_PROJECT_BUDGET_USD`), `402` al agotarse | [ai-generation.router.ts](../backend/src/modules/ai-generation/ai-generation.router.ts) |

## 🟠 Robustez

| # | Mejora | Solución | Archivos |
|---|--------|----------|----------|
| 11 | Import duplicado de `initDatabasePragmas` | Eliminado al reescribir el bootstrap | `main.ts` |
| 12 | Sin cierre elegante | Manejo de `SIGTERM`/`SIGINT` + `prisma.$disconnect()` | `main.ts`, [prisma.ts](../backend/src/config/prisma.ts) |
| 13 | Sin validación de entorno | Esquema Zod que aborta el arranque si falta/es inseguro | `env.ts` |
| 14 | Llamadas a IA sin timeout ni reintentos | `withRetry` (timeout + backoff + AbortSignal) | [retry.ts](../backend/src/common/utils/retry.ts), adaptadores |
| 15 | SQLite fijado; sin ruta a Postgres | Esquema de producción PostgreSQL + scripts | [schema.postgres.prisma](../backend/prisma/schema.postgres.prisma) |
| 16 | Enums como strings | Enums nativos en el esquema PostgreSQL | `schema.postgres.prisma` |
| 17 | JSON deserializado sin validar | `safeJsonArray`/`safeJsonObject` (no rompen ante datos corruptos) | [json.ts](../backend/src/common/utils/json.ts) |
| 18 | Faltaban índices | Índices en FKs y campos de filtro (`status`, `source`, `inputHash`) | [schema.prisma](../backend/prisma/schema.prisma) |
| 19 | Consulta pesada en `GET /projects` | Paginación + agregación acotada a la página | [projects.router.ts](../backend/src/modules/projects/projects.router.ts) |
| 20 | Sin paginación | Helpers `getPagination`/`sendPaginated` en los listados | [api-response.ts](../backend/src/common/utils/api-response.ts) |

## 🟠 Calidad de código y arquitectura

| # | Mejora | Solución | Archivos |
|---|--------|----------|----------|
| 21 | Lógica de negocio en los routers | Capa de servicios pura y testeable (métricas, exportación) | [metrics.service.ts](../backend/src/modules/metrics/metrics.service.ts), [export.service.ts](../backend/src/modules/export/export.service.ts) |
| 22 | try/catch repetido en cada endpoint | `asyncHandler` + manejador central | [async-handler.ts](../backend/src/common/middleware/async-handler.ts) |
| 23 | Respuestas inconsistentes (404/errores) | `ApiError` + `notFoundHandler` unificados | [api-error.ts](../backend/src/common/errors/api-error.ts) |
| 24 | Sin versionado de API | Rutas bajo `/api/v1` (+ alias `/api`) | `main.ts` |
| 25 | Sin ESLint/Prettier | Configuración + scripts `lint`/`format` | [.eslintrc.json](../backend/.eslintrc.json), [.prettierrc.json](../backend/.prettierrc.json) |
| 26 | Sin pre-commit | Husky + lint-staged | [.husky/pre-commit](../.husky/pre-commit) |
| 27 | Logging con `console.log` | Logger estructurado `pino` + `pino-http` + request-id | [logger.ts](../backend/src/common/utils/logger.ts), [request-id.ts](../backend/src/common/middleware/request-id.ts) |
| 28 | Sin compresión | `compression` (gzip) | `main.ts` |

## 🟡 Testing y CI/CD

| # | Mejora | Solución | Archivos |
|---|--------|----------|----------|
| 29 | Sin tests reales | Suite Vitest (25 tests) | [tests/](../backend/tests/) |
| 30 | Sin cobertura | `vitest --coverage` (servicios/utilidades ~97-99%) | [vitest.config.ts](../backend/vitest.config.ts) |
| 31 | Sin CI | GitHub Actions: lint → typecheck → test → build → docker | [.github/workflows/ci.yml](../.github/workflows/ci.yml) |
| 32 | Sin Dockerfile de la app | Dockerfile multi-stage + healthcheck + usuario no-root | [Dockerfile](../backend/Dockerfile) |
| 33 | `db push` en vez de migraciones | Scripts `prisma:migrate`/`prisma:deploy` + esquema Postgres | `package.json` |

## 🟡 Funcionalidad y producto

| # | Mejora | Solución | Archivos |
|---|--------|----------|----------|
| 34 | Sin refresh tokens | Access token corto + refresh token con rotación (`/auth/refresh`) | `auth.middleware.ts`, `auth.router.ts` |
| 35 | Sin caché de generaciones IA | Hash SHA-256 de entradas; reutiliza generación idéntica (0 costo) | `ai-generation.router.ts`, `schema.prisma` |
| 36 | Sin documentación de API | OpenAPI + Swagger UI en `/api/docs` | [swagger.ts](../backend/src/config/swagger.ts) |
| 37 | Healthcheck no cubría la IA | Endpoint `GET /api/health/ai` | `main.ts` |
| 38 | Sin auditoría de acciones | Rastro de auditoría estructurado (login, create/delete, IA) | [audit.ts](../backend/src/common/utils/audit.ts) |
| 39 | Frontend sin módulos claros | Confirmado uso de ES Modules (`type="module"`); compatible con respuestas paginadas | `frontend/index.html`, `frontend/js/api.js` |
| 40 | `.env.example` incompleto | Plantilla completa y documentada de todas las variables | [.env.example](../backend/.env.example) |

---

## Nuevas variables de entorno

Ver [`.env.example`](../backend/.env.example). Añadidas: `LOG_LEVEL`, `BCRYPT_ROUNDS`, `CORS_ORIGINS`, `AI_REQUEST_TIMEOUT_MS`, `AI_MAX_RETRIES`, `AI_PROJECT_BUDGET_USD`, `JWT_REFRESH_SECRET`, `ACCESS_TOKEN_EXPIRES_IN`, `REFRESH_TOKEN_EXPIRES_IN`.

## Verificación

```bash
cd backend
npm install
npm run prisma:generate
npm run lint         # 0 errores
npm run typecheck    # sin errores
npm run test         # 25 tests OK
npm run build        # compila a dist/
```

## Migración a PostgreSQL (producción)

1. `docker compose up -d` (levanta PostgreSQL + pgAdmin).
2. Copiar `prisma/schema.postgres.prisma` sobre `prisma/schema.prisma`.
3. Definir `DATABASE_URL="postgresql://..."` en `.env`.
4. `npm run prisma:deploy` (aplica migraciones) y `npm run prisma:seed`.
