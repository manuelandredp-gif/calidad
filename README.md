# TestGenAI — MVP Real Consolidado

> **Sistema Inteligente de Generación y Gestión de Casos de Prueba Funcionales con Auditoría Humana y Trazabilidad**  
> Basado en la propuesta académica de: [README_FLORES_DONGO.md](./README_FLORES_DONGO.md) (Propuesta de investigación, evaluación empírica formal pendiente).

---

## 1. Alcance y Arquitectura del MVP

TestGenAI ha sido consolidado como un MVP real, libre de simuladores (`mock`), generadores heurísticos offline de sustitución y cuentas demo pre-cargadas. Una instalación limpia inicia con la base de datos completamente vacía.

| Capa | Tecnología | Características clave |
|---|---|---|
| **Frontend** | HTML5, Vanilla CSS, JavaScript (ES Modules) | SPA con 7 vistas básicas: Inicio, Proyectos, Requisitos, Casos & Revisión, Trazabilidad, Métricas e Historial, Configuración & Usuarios. |
| **Backend API** | Node.js, Express, TypeScript | Arquitectura hexagonal / modular limpia. Prefijo unificado `/api/v1`. |
| **Persistencia** | PostgreSQL 16 + Prisma ORM | Esquema único consolidado, campos nativos `Json`, versionado atómico de requisitos y casos, sesiones persistidas. |
| **Inteligencia Artificial** | Google Gemini / OpenAI (`IAIProvider`) | Adaptadores reales con validación estricta de salida Zod, enmascaramiento bidireccional de PII y errores explícitos (sin fallback simulado). |
| **Seguridad de Sesión** | Cookies HttpOnly + JWT | Access token corto (1h) y Refresh token persistido y rotado en BD (7d). El registro público fija el rol `QA_TESTER`. |

---

## 2. Requisitos Previos

- **Node.js** >= 20.x
- **PostgreSQL** >= 15.x (o Docker para levantar la instancia incluida)
- **API Key** real de Google Gemini (`GEMINI_API_KEY`) o OpenAI (`OPENAI_API_KEY`)

---

## 3. Puesta en Marcha Rápida (Local)

### 3.1. Levantar PostgreSQL con Docker Compose

```bash
docker compose up -d postgres
```
Esto iniciará una base de datos PostgreSQL 16 en `localhost:5432` con la base `calidad_db`.

### 3.2. Configuración del Backend

```bash
cd backend
cp .env.example .env
```

Edite `.env` y configure sus variables esenciales:
```env
PORT=4000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres_password_2026@localhost:5432/calidad_db?schema=public"

# Genere un secreto seguro para JWT:
# node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
JWT_SECRET="su_clave_secreta_jwt_minimo_32_caracteres"

# Proveedor de IA por defecto: 'gemini' o 'openai'
AI_PROVIDER_DEFAULT=gemini
GEMINI_API_KEY=su_clave_real_de_gemini
# OPENAI_API_KEY=su_clave_real_de_openai
```

### 3.3. Instalación y Migraciones

```bash
npm install
npm run prisma:generate
npm run prisma:deploy
```
*(No hay seeds automáticos: la base de datos queda vacía y lista para su uso real).*

### 3.4. Creación del Administrador Inicial

Para crear una cuenta de administrador de forma segura mediante CLI interactivo:

```bash
npm run admin:create
```
El script le solicitará nombre, email y contraseña segura por consola.

### 3.5. Iniciar la Aplicación

```bash
npm run dev
```

- **Aplicación Web (SPA):** [http://localhost:4000](http://localhost:4000)
- **Healthcheck del Sistema:** [http://localhost:4000/api/health](http://localhost:4000/api/health)
- **Documentación OpenAPI (Swagger):** [http://localhost:4000/api/docs](http://localhost:4000/api/docs)

---

## 4. Scripts Disponibles (`backend/`)

| Script | Propósito |
|---|---|
| `npm run dev` | Inicia el servidor en modo desarrollo (tsx watch) |
| `npm run build` | Compila TypeScript a `dist/` |
| `npm start` | Ejecuta la build compilada en producción |
| `npm run typecheck` | Comprobación estricta de tipos (`tsc --noEmit`) |
| `npm run lint` | Análisis estático de código con ESLint |
| `npm test` | Ejecuta la suite de pruebas unitarias con Vitest |
| `npm run prisma:deploy` | Aplica migraciones pendientes de PostgreSQL en producción |
| `npm run prisma:migrate` | Genera y aplica migraciones de base de datos en desarrollo |
| `npm run admin:create` | Asistente de línea de comandos para crear administradores |
| `npm run data:maintenance` | Diagnóstico (`--dry-run`) y limpieza controlada de datos de muestra |

---

## 5. Recorrido Principal de Uso

1. **Autenticación:** El usuario se registra o inicia sesión. La sesión se gestiona con cookies HttpOnly protegidas.
2. **Proyectos:** Creación de un proyecto explícito (`ACTIVE` o `ARCHIVED`).
3. **Requisitos Funcionales:** Registro manual o importación masiva por CSV/JSON. El sistema detecta términos ambiguos (RF-13) y versiona automáticamente cada edición.
4. **Generación con IA Real:** Solicita casos de prueba a Gemini u OpenAI. El backend valida el esquema Zod, registra tokens y calcula latencia real. Si falta la API key, se informa el error 502/503 sin simular casos.
5. **Auditoría Humana:** El QA revisa cada caso de forma individual en el modal de revisión:
   - Puede editar pasos, precondiciones, datos o resultado esperado.
   - Si aprueba un caso en estado `conflict`, se exige justificación técnica.
   - Si rechaza un caso, el comentario es obligatorio para el historial.
   - Se guarda snapshot inmutable del antes/después con auditoría.
6. **Trazabilidad y Métricas:** Matriz de trazabilidad con cálculo de cobertura sobre requisitos activos y casos aprobados vigentes. Métricas de tokens, costos reales e historial de revisiones.
7. **Exportación:** Descarga de casos aprobados vigentes en formatos CSV, JSON y Markdown.

---

## 6. Mantenimiento y Respaldo de Datos

- Para examinar datos de muestra heredados sin eliminarlos:
  ```bash
  npm run data:maintenance -- --dry-run
  ```
- Para aplicar la limpieza sobre los registros identificados en el manifiesto:
  ```bash
  npm run data:maintenance -- --apply
  ```
- Un respaldo exportado en JSON de la base de datos anterior se conserva en: `backend/prisma/backup/dev-db-export.json`.

---

## 7. Despliegue con Docker

Para compilar y ejecutar el contenedor completo (Backend API + Frontend SPA + PostgreSQL):

```bash
docker compose up -d --build
```
El contenedor se ejecuta bajo usuario no privilegiado (`nodejs`) exponiendo el puerto 4000.
