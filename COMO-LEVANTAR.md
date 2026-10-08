> Estas instrucciones describen el entorno local del ZIP. En producción se usa Supabase, Render y Vercel. Las migraciones se aplican con `npm run prisma:deploy`; no ejecutar `prisma db push` sobre producción. Los usuarios de producción se conservan.

# TestGenAI — Cómo levantar en local (sin Docker)

Este proyecto normalmente usa Docker + PostgreSQL. Como esta máquina **no tiene Docker ni PostgreSQL instalado**,
se configuró un **PostgreSQL embebido** (binario autocontenido en `.pgtool/`) que corre en `localhost:5432`
(cluster inicializado en **UTF8** para soportar emojis/acentos del motor).

## Correcciones aplicadas al código del zip (bugs que impedían que funcionara)
1. **Migración Prisma obsoleta**: el `schema.prisma` tenía columnas/tablas que la migración incluida no creaba
   (p. ej. `next_use_case_number`). → Se sincronizó la BD al schema real con `prisma db push`.
2. **Módulo `spec` no montado**: el motor determinista (`/api/v1/spec/*`) existía pero no estaba enganchado en
   `src/main.ts`. → Montado.
3. **Regex inválido** en `src/core/spec-engine/text-normalizer.ts` (`/p{Diacritic}/` → `/\p{Diacritic}/`). → Corregido.
4. **Modelo `AiGeneration` faltante**: el código (lista de proyectos, métricas, requisitos, IA) usaba
   `prisma.aiGeneration` y `testCase.generationId`, pero el schema consolidado los había perdido. → Reintroducidos.
5. **Frontend**: se añadió la vista **Casos de Uso**, la opción *Generar especificación automáticamente al crear*
   (con profundidad) y los métodos de API `/spec/*`. Así, al crear un proyecto se generan casos de uso,
   requisitos y casos de prueba **según el contexto, con o sin IA**.

## URLs
- App (SPA): http://localhost:4000
- Health:    http://localhost:4000/api/health
- Swagger:   http://localhost:4000/api/docs

## Credenciales del administrador inicial
- Email:    `admin@local.test`
- Password: `Admin.Local2026`

> Puedes crear más usuarios desde "Crear Cuenta" (rol QA_TESTER) o con:
> `cd backend && npx tsx scripts/create-admin.ts --email "x@y.com" --name "Nombre" --password "Clave1234"`

## IA (opcional)
El backend arranca sin claves de IA. La generación con IA (Gemini/OpenAI) devolverá error 502/503
hasta que pongas una clave real en `backend/.env` (`GEMINI_API_KEY` o `OPENAI_API_KEY`).
El **motor determinista** (sin IA) sí funciona para generar casos/requisitos.

---

## Arrancar de nuevo (tras reiniciar el PC)

### 1) Iniciar PostgreSQL embebido
```powershell
cd C:\Users\Manuel_Dongo\testgenai-calidad\.pgtool
node start-pg.mjs
```
(Déjalo corriendo; el cluster de datos vive en `.pgtool/data`.)

### 2) Iniciar el backend + frontend
```powershell
cd C:\Users\Manuel_Dongo\testgenai-calidad\backend
npm run dev
```

## Migrar a un PostgreSQL "real" más adelante
Solo cambia `DATABASE_URL` en `backend/.env` a tu instancia (Docker, Supabase, Neon, etc.)
y ejecuta `npx prisma migrate deploy`. No hace falta el PostgreSQL embebido.
