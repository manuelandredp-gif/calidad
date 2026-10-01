# TestGenAI — Guía técnica y de puesta en marcha

Generador inteligente de casos de prueba funcionales (IA + heurísticas ISTQB) con auditoría humana y trazabilidad.
Backend **Node.js + Express + Prisma + TypeScript**; frontend **HTML/CSS/JS (ES Modules)**.

> 📄 Documento académico del proyecto: [README_FLORES_DONGO.md](./README_FLORES_DONGO.md)
> 🔧 Mejoras técnicas aplicadas (v1.1): [docs/MEJORAS_IMPLEMENTADAS.md](./docs/MEJORAS_IMPLEMENTADAS.md)
> 📚 Documentación adicional: [docs/](./docs/)

---

## Requisitos

- Node.js **>= 20**
- (Opcional) Docker, para PostgreSQL + pgAdmin

## Puesta en marcha (desarrollo, SQLite)

```bash
cd backend
cp .env.example .env          # y edite JWT_SECRET
npm install
npm run prisma:generate
npm run prisma:push           # crea/actualiza el esquema en dev.db
npm run prisma:seed           # datos de ejemplo (opcional)
npm run dev                   # http://localhost:4000
```

- App y frontend: `http://localhost:4000`
- Healthcheck: `http://localhost:4000/api/health`
- Documentación de la API (Swagger UI): `http://localhost:4000/api/docs`

> ⚠️ Genere un `JWT_SECRET` real:
> ```bash
> node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
> ```

## Scripts disponibles (`backend/`)

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Servidor en modo watch (tsx) |
| `npm run build` | Compila TypeScript a `dist/` |
| `npm start` | Ejecuta la build de producción |
| `npm run typecheck` | Verificación de tipos sin emitir |
| `npm run lint` / `lint:fix` | ESLint |
| `npm run format` | Prettier |
| `npm test` / `test:coverage` | Vitest (con cobertura) |
| `npm run prisma:migrate` / `prisma:deploy` | Migraciones (PostgreSQL) |

## Producción con PostgreSQL

```bash
cd backend
docker compose up -d                                   # PostgreSQL + pgAdmin
cp prisma/schema.postgres.prisma prisma/schema.prisma  # esquema con enums
# En .env: DATABASE_URL="postgresql://postgres:postgres_password_2026@localhost:5432/calidad_db?schema=public"
npm run prisma:deploy
npm run build && npm start
```

### Docker (imagen de la app)

Construir **desde la raíz del repo** (para incluir el frontend):

```bash
docker build -f backend/Dockerfile -t testgenai .
docker run -p 4000:4000 --env-file backend/.env testgenai
```

## Seguridad (resumen)

- Autenticación JWT con **access token corto + refresh token** (`/api/v1/auth/refresh`).
- **Autorización por recurso** (evita IDOR): cada usuario solo accede a sus proyectos.
- `helmet`, CORS por allowlist, **rate limiting**, validación de entrada con Zod.
- Validación de entorno en el arranque; secretos fuera del repositorio.
- Presupuesto de gasto de IA por proyecto y caché de generaciones.

## Estructura

```
backend/
  src/
    common/        # middlewares, utils, errores (capas transversales)
    config/        # env, prisma, swagger
    core/          # adaptadores de IA, heurísticas, prompts
    modules/       # auth, projects, requirements, ai-generation, test-cases,
                   # heuristics, metrics, export, traceability (router + service)
  prisma/          # schema.prisma (SQLite) y schema.postgres.prisma (prod)
  tests/           # Vitest
frontend/          # SPA estática (ES Modules)
docs/              # documentación técnica y académica
```

## CI

GitHub Actions ejecuta en cada push/PR: **lint → typecheck → test (cobertura) → build → build de Docker**.
Ver [.github/workflows/ci.yml](./.github/workflows/ci.yml).
