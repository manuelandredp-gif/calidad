# Catálogo de Endpoints de la API REST — TestGenAI

**Versión de la API:** 1.0.0  
**Base URL Local:** `http://localhost:4000/api/v1` (alias retrocompatible: `http://localhost:4000/api`)  
**Autenticación:** Cabecera HTTP `Authorization: Bearer <ACCESS_TOKEN>` (access token de vida corta; renovable con `/auth/refresh`)  
**Documentación interactiva (Swagger UI):** `GET /api/docs` — spec OpenAPI en `GET /api/docs.json`  
**Formato de Respuesta:** JSON estándar `{ "success": boolean, "data": ..., "message": string, "error"?: string }`  
**Respuestas paginadas:** los listados devuelven además `meta: { page, pageSize, total, totalPages }` y aceptan `?page=&pageSize=` (pageSize máx. 100).

> **Seguridad aplicada:** cabeceras `helmet`, compresión gzip, CORS por allowlist (`CORS_ORIGINS`), `X-Request-Id` por petición y **rate limiting**: `/auth` 10 req/15 min, `/ai` 20 req/5 min, resto 120 req/min.
> **Autorización a nivel de recurso:** todo endpoint verifica la propiedad del recurso (proyecto→requisito→caso). Acceder a recursos de otro usuario devuelve `404`.

---

## 1. Estado y Salud

### `GET /health`
Verifica el estado del servicio y configuración activa del backend.
- **Acceso:** Público
- **Respuesta (200 OK):**
```json
{
  "status": "online",
  "timestamp": "2026-09-14T17:15:00.000Z",
  "service": "TestGenAI Backend Core",
  "version": "1.0.0",
  "environment": "development",
  "aiDefaultProvider": "mock"
}
```

### `GET /health/db`
Diagnóstico de conectividad con la base de datos (motor y conteos de entidades). **Acceso:** Público.

### `GET /health/ai`
Verifica que el proveedor de IA por defecto esté configurado (presencia de API key). Devuelve `200` si está listo o `503` si falta la clave (en cuyo caso operará el motor heurístico de repuesto). **Acceso:** Público.
```json
{ "provider": "gemini", "configured": true, "fallback": "HeuristicEngine (determinista, 0 tokens)", "message": "..." }
```

---

## 2. Autenticación (`/auth`)

### `POST /auth/register`
Registra un nuevo usuario en la plataforma.
- **Acceso:** Público
- **Body (JSON):**
```json
{
  "email": "usuario@test.com",
  "password": "Password123*",
  "fullName": "Juan Pérez",
  "role": "QA_TESTER" // Opcional: QA_TESTER, QA_LEAD, DEVELOPER, ADMIN
}
```
- **Política de contraseña:** mínimo 8 caracteres, con al menos una minúscula, una mayúscula y un dígito.
- **Respuesta (201 Created):** Retorna el usuario creado y sus tokens: `token` (= `accessToken`, alias retrocompatible), `accessToken` y `refreshToken`.

### `POST /auth/login`
Inicia sesión y genera el par de tokens (access + refresh).
- **Acceso:** Público
- **Body (JSON):**
```json
{
  "email": "admin@testgenai.com",
  "password": "Admin123*TestGenAI"
}
```
- **Respuesta (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid...",
      "email": "admin@testgenai.com",
      "fullName": "Administrador Principal",
      "role": "ADMIN"
    },
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "accessToken": "eyJhbGciOiJIUzI1NiIsIn...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsIn..."
  },
  "message": "Inicio de sesión exitoso"
}
```

### `POST /auth/refresh`
Emite un nuevo par de tokens a partir de un `refreshToken` válido (rotación de tokens).
- **Acceso:** Público (requiere refresh token en el body).
- **Body (JSON):** `{ "refreshToken": "eyJ..." }`
- **Respuesta (200 OK):** `{ "token", "accessToken", "refreshToken" }`. Devuelve `401` si el refresh token es inválido/expirado o el usuario ya no existe.

### `GET /auth/me`
Obtiene el perfil y rol del usuario autenticado.
- **Acceso:** Requiere Access Token.

---

## 3. Gestión de Proyectos (`/projects`)

### `GET /projects`
Lista los proyectos **del usuario autenticado** (los ADMIN ven todos), paginados, con métricas consolidadas (conteo de requisitos, casos de prueba, cobertura % y costo total en USD).
- **Acceso:** Requiere Access Token.
- **Query params:** `?page=1&pageSize=20` (respuesta incluye `meta`).

### `POST /projects`
Crea un nuevo proyecto de software.
- **Body (JSON):**
```json
{
  "name": "Portal E-Commerce & Checkout v2.0",
  "description": "Plataforma de comercio electrónico"
}
```

### `GET /projects/:id`
Detalle del proyecto con la lista de sus requisitos.

### `PUT /projects/:id`
Actualiza nombre, descripción o estado (`ACTIVE`, `ARCHIVED`).

### `DELETE /projects/:id`
Elimina el proyecto y sus requisitos/casos asociados en cascada.

---

## 4. Requisitos Funcionales (`/requirements`)

### `GET /requirements/project/:projectId`
Lista todos los requisitos de un proyecto con conteo de casos asociados.

### `GET /requirements/:id`
Obtiene un requisito con todos sus casos de prueba y su historial de llamadas de IA.

### `POST /requirements`
Crea un nuevo requisito funcional.
- **Body (JSON):**
```json
{
  "projectId": "uuid-proyecto",
  "code": "REQ-003",
  "title": "Recuperación de Contraseña",
  "description": "Como usuario registrado deseo restablecer mi clave...",
  "acceptanceCriteria": "1. El correo debe existir.\n2. Se envía un enlace temporal..."
}
```

### `PUT /requirements/:id`
Actualiza el requisito. Si la descripción o los criterios de aceptación cambian, el campo `version` se incrementa automáticamente.

### `DELETE /requirements/:id`
Elimina el requisito.

### `POST /requirements/import`
Importación masiva de requisitos por lote.
- **Body (JSON):**
```json
{
  "projectId": "uuid-proyecto",
  "requirements": [
    {
      "code": "REQ-004",
      "title": "Registro de nuevos clientes",
      "description": "...",
      "acceptanceCriteria": "..."
    }
  ]
}
```

---

## 5. Orquestación de Inteligencia Artificial (`/ai`)

### `POST /ai/generate`
Dispara la generación de casos de prueba asistida por IA para un requisito.
- **Body (JSON):**
```json
{
  "requirementId": "uuid-del-requisito",
  "provider": "mock", // "gemini" | "openai" | "mock"
  "model": "mock-istqb-v1", // Opcional (ej. "gemini-1.5-flash", "gpt-4o-mini")
  "temperature": 0.2, // Opcional (0.0 a 1.0)
  "clearPreviousUnapproved": false // Opcional (eliminar casos pendientes previos)
}
```
- **Flujo Interno:**
  1. Ensambla el prompt versionado con directivas ISTQB y mitigación de alucinaciones.
  2. Ejecuta la inferencia contra el adaptador seleccionado.
  3. Inserta registro de auditoría en `ai_generations` (tokens, latencia en ms, costo en USD).
  4. Crea los casos en `test_cases` con estado `PENDING` y clasificación de evidencia (`derived` o `suggested`).
  5. Actualiza el estado del requisito a `GENERATED`.

### `GET /ai/history/:requirementId`
Consulta el historial de todas las ejecuciones de IA sobre un requisito para comparar modelos, latencia y costos.

---

## 5.b Motor Heurístico Determinista — Sin IA (`/heuristics`)

### `POST /heuristics/generate`
Genera casos de prueba automáticamente aplicando técnicas formales ISTQB (Partición de Equivalencia, Análisis de Valores Límite y Reglas de Decisión) **sin invocar modelos de lenguaje, con 0 consumo de tokens y 100% offline**.
- **Body (JSON):**
```json
{
  "requirementId": "uuid-del-requisito",
  "clearPrevious": false // Opcional
}
```
- **Respuesta (201 Created):** Retorna los casos con `source: "RULE_BASED"`, `tokensConsumed: 0`, `costUsd: 0` y la lista de patrones de prueba identificados (`rulesMatched`).

---

## 6. Casos de Prueba, Diseño Manual y Revisión (`/test-cases`)

### `GET /test-cases/requirement/:requirementId`
Lista todos los casos de prueba de un requisito con sus precondiciones, pasos estructurados, origen (`source`: `MANUAL`, `RULE_BASED`, `AI_GENERATED`) y revisiones previas.

### `GET /test-cases/:id`
Obtiene un caso específico con su requisito padre y el historial completo de auditoría de revisiones.

### `POST /test-cases` — Creación 100% Manual (Humano)
Permite al QA redactar casos de prueba desde cero sin depender de IA ni generadores automáticos.
- **Body (JSON):**
```json
{
  "requirementId": "uuid-del-requisito",
  "type": "negative", // positive, negative, alternative, boundary, validation
  "title": "Verificación de inyección SQL en formulario de login",
  "preconditions": ["Servidor web con WAF activo"],
  "steps": [
    "Ingresar payload malicioso en campo de usuario",
    "Ingresar contraseña cualquiera",
    "Hacer clic en Iniciar Sesión"
  ],
  "testData": "usuario=' OR 1=1 --",
  "expectedResult": "El sistema rechaza la petición con código 400 y bloquea la consulta",
  "priority": "high",
  "evidenceStatus": "derived",
  "status": "APPROVED" // O PENDING
}
```
- **Respuesta (201 Created):** Retorna el caso creado con código asignado correlativamente y `source: "MANUAL"`.

### `PUT /test-cases/:id` — Edición Integral Manual
Modifica cualquier campo del caso de prueba en cualquier momento.

### `POST /test-cases/:id/clone` — Clonación para Variantes Manuales
Duplica un caso de prueba existente para que el QA pueda crear variaciones de prueba rápidamente sin tener que reescribir todos los pasos.

### `PATCH /test-cases/:id/review`
Acción del revisor humano (*Human-in-the-Loop*).
- **Body (JSON):**
```json
{
  "decision": "APPROVED", // "APPROVED" | "MODIFIED" | "REJECTED"
  "comments": "Caso verificado con el analista de negocio.",
  // Campos opcionales si se selecciona "MODIFIED" para corregir pasos o datos:
  "title": "Nuevo título corregido",
  "steps": ["Paso 1 corregido", "Paso 2..."],
  "expectedResult": "Resultado esperado ajustado"
}
```
- **Auditoría:** Guarda automáticamente una instantánea del caso antes (`previousContent`) y después (`newContent`) en la tabla `test_case_reviews` con el usuario revisor.

---

## 7. Matriz de Trazabilidad (`/traceability`)

### `GET /traceability/:projectId`
Genera la matriz bidireccional requisito–caso de prueba.
- **Métricas calculadas:**
  - `totalRequirements`
  - `coveredRequirementsCount` (requisitos con al menos 1 caso aprobado)
  - `coveragePercent` (%)
  - Mapeo completo de cada requisito con sus casos y estados.

---

## 8. Dashboard y Métricas ISTQB (`/metrics`)

### `GET /metrics/project/:projectId`
Retorna todos los indicadores científicos de calidad para la tesis y gestión:
- **Resumen:** Requisitos totales, cubiertos, total de casos y estados.
- **Tasas ISTQB:**
  - Tasa de Aprobación (%)
  - Tasa de Modificación (%)
  - Tasa de Rechazo (%)
- **Desglose de Origen (Independencia de IA):**
  - Casos `manual` (conteo y %)
  - Casos `ruleBased` (conteo y %)
  - Casos `aiGenerated` (conteo y %)
- **Calidad de Evidencia (Control de Alucinaciones):**
  - Casos con evidencia `derived` (%)
  - Casos con evidencia `suggested` (% de supuestos no respaldados)
- **Distribución de Pruebas:** Conteo por tipo (`positive`, `negative`, `alternative`, `boundary`, `validation`).
- **Economía de IA:** Tokens de entrada, tokens de salida, costo total acumulado en USD y latencia promedio en ms.

---

## 9. Exportación (`/export`)

### `GET /export/:projectId?format=json|csv|markdown&onlyApproved=true`
Exporta los casos de prueba del proyecto:
- **`format=csv`**: Descarga directa de archivo CSV compatible con Jira (Xray) y TestRail.
- **`format=markdown`**: Descarga de especificación de casos de prueba formateada para informes formales.
- **`format=json`**: JSON estructurado para integraciones externas.
