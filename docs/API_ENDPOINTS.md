# Catálogo de Endpoints de la API REST — TestGenAI MVP Real

**Versión de la API:** 1.0 (MVP Real Consolidado)  
**Base URL:** `http://localhost:4000/api/v1`  
**Autenticación:** Cookies HttpOnly seguras (`testgenai_session` / `testgenai_refresh`) o cabecera `Authorization: Bearer <ACCESS_TOKEN>`.  
**Swagger UI:** `http://localhost:4000/api/docs`  
**Formato de Respuesta:** JSON estándar `{ "success": boolean, "data": ..., "message": string, "meta"?: { "page": number, "pageSize": number, "total": number, "totalPages": number } }`

---

## 1. Salud y Diagnóstico

### `GET /api/health`
Estado del servicio.
- **Acceso:** Público
- **Respuesta (200 OK):**
```json
{
  "status": "online",
  "service": "TestGenAI Backend Core",
  "version": "1.0.0",
  "environment": "development"
}
```

### `GET /api/health/db`
Diagnóstico de conectividad con la base de datos PostgreSQL.
- **Acceso:** Público (informa estado de conexión sin exponer cantidades globales sensibles).

---

## 2. Autenticación y Sesión (`/api/v1/auth`)

### `POST /api/v1/auth/register`
Registra un nuevo usuario.
- **Acceso:** Público.
- **Seguridad:** El servidor fija obligatoriamente el rol `QA_TESTER`. Cualquier valor de `role` enviado en el body es ignorado o rechazado.
- **Body:** `{ "email": "usuario@empresa.com", "password": "Password123*", "fullName": "Nombre Apellido" }`
- **Respuesta (201):** Retorna el usuario creado y establece cookies HttpOnly.

### `POST /api/v1/auth/login`
Inicia sesión con credenciales válidas.
- **Acceso:** Público.
- **Body:** `{ "email": "...", "password": "..." }`
- **Respuesta (200):** Retorna datos del usuario y establece cookies HttpOnly: `testgenai_session` (1 hora) y `testgenai_refresh` (7 días).

### `POST /api/v1/auth/refresh`
Renueva el access token mediante rotación del refresh token.
- **Acceso:** Cookie `testgenai_refresh` o Bearer token.
- **Seguridad:** Invalida el token anterior en `AuthSession` e emite uno nuevo.

### `POST /api/v1/auth/logout`
Cierra la sesión activa.
- **Acceso:** Autenticado.
- **Seguridad:** Revoca la sesión en la base de datos y borra las cookies con los mismos atributos `HttpOnly`, `Path` y `SameSite`.

### `GET /api/v1/auth/me`
Obtiene los datos del usuario autenticado.

---

## 3. Administración de Usuarios (`/api/v1/users`) — Solo ADMIN

- `GET /api/v1/users`: Lista paginada de usuarios registrados.
- `PATCH /api/v1/users/:id/role`: Modifica el rol (`QA_TESTER`, `QA_LEAD`, `DEVELOPER`, `ADMIN`). Impide despojar de rol al último administrador activo.
- `PATCH /api/v1/users/:id/status`: Activa o desactiva la cuenta (`isActive: boolean`).

---

## 4. Configuración y Preferencias (`/api/v1/config`)

- `GET /api/v1/config/ai-providers`: Retorna proveedores reales (`gemini`, `openai`), modelos permitidos y si la API key está configurada (sin revelar las claves).
- `GET /api/v1/config/preferences`: Obtiene preferencias del usuario.
- `PUT /api/v1/config/preferences`: Guarda preferencias (proveedor y modelo preferido).

---

## 5. Proyectos (`/api/v1/projects`)

- `GET /api/v1/projects`: Lista paginada de proyectos accesibles por el usuario.
- `POST /api/v1/projects`: Crea un proyecto nuevo.
- `GET /api/v1/projects/:id`: Detalle del proyecto.
- `PUT /api/v1/projects/:id`: Actualiza nombre o descripción.
- `PATCH /api/v1/projects/:id/archive`: Archiva o reactiva un proyecto.

---

## 6. Requisitos Funcionales (`/api/v1/requirements`)

- `GET /api/v1/requirements`: Lista paginada de requisitos del proyecto activo.
- `POST /api/v1/requirements`: Crea un requisito con código secuencial atómico (`REQ-001`).
- `GET /api/v1/requirements/:id`: Detalle del requisito con análisis de ambigüedad (RF-13).
- `PUT /api/v1/requirements/:id`: Edición versionada. Exige `expectedVersion`. Incrementa la versión, guarda snapshot en `RequirementVersion` y marca casos previos como obsoletos.
- `GET /api/v1/requirements/:id/versions`: Historial de versiones del requisito.
- `POST /api/v1/requirements/import`: Importación atómica de requisitos vía CSV o JSON con validación completa por fila.

---

## 7. Generación de Casos de Prueba con IA (`/api/v1/ai`)

- `POST /api/v1/ai/generate`: Invoca a Gemini u OpenAI real para generar casos a partir de un requisito activo. Valida la salida con Zod, enmascara PII, detecta duplicados y persiste casos en estado `PENDING`. Si falta la API key, responde con error HTTP 502/503.
- `POST /api/v1/ai/regenerate`: Vuelve a generar casos para el requisito preservando el historial anterior (sin borrar ejecuciones ni casos previos).
- `GET /api/v1/ai/generations/:requirementId`: Historial de ejecuciones de IA con tokens, costo y latencia.

---

## 8. Casos de Prueba y Auditoría Humana (`/api/v1/test-cases`)

- `GET /api/v1/test-cases`: Lista paginada de casos con filtros por requisito, tipo, estado y vigencia.
- `GET /api/v1/test-cases/:id`: Detalle completo del caso de prueba.
- `POST /api/v1/test-cases/:id/review`: Auditoría humana individual:
  - Permite editar: `title`, `preconditions`, `steps`, `testData`, `expectedResult`, `priority`.
  - Exige `expectedVersion` para control de concurrencia optimista (409 en conflicto).
  - Decisiones: `APPROVED`, `REJECTED`, `MODIFIED`.
  - Exige comentario obligatorio ante `REJECTED`.
  - Exige justificación explícita para aprobar casos con evidencia en conflicto (`conflict`).
  - Guarda snapshot completo en `TestCaseReview`.
- `GET /api/v1/test-cases/:id/reviews`: Historial inmutable de auditorías del caso.

---

## 9. Trazabilidad, Métricas y Exportación

- `GET /api/v1/traceability/:projectId`: Matriz de trazabilidad con cálculo de cobertura sobre casos aprobados vigentes.
- `GET /api/v1/metrics/:projectId`: Métricas consolidadas del proyecto (cobertura, casos por estado, distribución ISTQB, economía de IA).
- `GET /api/v1/export/:projectId?format=csv|json|markdown`: Exporta exclusivamente casos aprobados vigentes en el formato especificado.
