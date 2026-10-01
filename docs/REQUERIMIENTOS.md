# Especificación de Requisitos de Software — TestGenAI

**Sistema:** TestGenAI (Generador Inteligente de Casos de Prueba Funcionales a partir de Requisitos de Software)  
**Versión:** 1.0.0  
**Fecha:** Septiembre 2026  
**Estado:** Propuesta de Arquitectura y Especificación  

---

## 1. Introducción y Propósito

El presente documento define formalmente los requerimientos funcionales, no funcionales y reglas de negocio de la plataforma **TestGenAI**. El sistema está concebido como una aplicación web de asistencia al profesional de Aseguramiento de Calidad (QA), cuyo objetivo es transformar requisitos de software, historias de usuario y criterios de aceptación en conjuntos exhaustivos y estructurados de casos de prueba funcionales mediante Modelos de Lenguaje (LLMs), preservando en todo momento la trazabilidad, el control de costos y la validación humana obligatoria.

---

## 2. Actores del Sistema

| Actor | Descripción | Responsabilidades Principales |
|---|---|---|
| **QA Tester / Analista de Pruebas** | Usuario operativo principal. | Carga requisitos, ejecuta la generación asistida con IA, analiza evidencia, edita, aprueba o rechaza casos de prueba. |
| **QA Lead / Líder de Calidad** | Supervisor de calidad del proyecto. | Monitorea la cobertura de pruebas, aprueba matrices de trazabilidad, consulta métricas de calidad y costos de IA. |
| **Desarrollador** | Usuario técnico consultor. | Consulta los casos de prueba asociados a un requisito para guiar el desarrollo y depurar comportamientos esperados. |
| **Administrador del Sistema** | Gestor de la plataforma. | Configura credenciales de proveedores de IA, define límites de tokens y presupuesto, gestiona cuentas y roles. |

---

## 3. Requisitos Funcionales (RF)

### 3.1 Módulo de Autenticación y Usuarios
- **RF-01 (Autenticación Segura):** `[IMPLEMENTADO EN BACKEND]` El sistema debe permitir el inicio de sesión mediante credenciales (email y contraseña cifrada con bcrypt) y generar tokens de acceso JWT con tiempo de expiración. Endpoint: `POST /api/auth/login`.
- **RF-02 (Gestión de Perfiles y Roles):** `[IMPLEMENTADO EN BACKEND]` El sistema debe controlar el acceso a funciones mediante RBAC con los roles: `QA_TESTER`, `QA_LEAD`, `DEVELOPER` y `ADMIN`. Middleware: `requireRoles()`.

### 3.2 Módulo de Gestión de Proyectos
- **RF-03 (CRUD de Proyectos):** `[IMPLEMENTADO EN BACKEND]` El sistema debe permitir crear, listar, consultar el detalle, editar y archivar proyectos de software. Endpoints: `GET, POST, PUT, DELETE /api/projects`.
- **RF-04 (Métricas por Proyecto):** `[IMPLEMENTADO EN BACKEND]` Cada proyecto debe consolidar contadores en tiempo real: número total de requisitos, casos generados, casos aprobados, cobertura (%) y costo acumulado en USD. Endpoint: `GET /api/projects`.

### 3.3 Módulo de Gestión de Requisitos
- **RF-05 (Registro y Versionado de Requisitos):** `[IMPLEMENTADO EN BACKEND]` El sistema debe permitir registrar requisitos funcionales indicando: código único (`REQ-001`), título, descripción detallada, criterios de aceptación y versión automática ante cambios. Endpoints: `POST, PUT /api/requirements`.
- **RF-06 (Importación Masiva de Requisitos):** `[IMPLEMENTADO EN BACKEND]` El sistema debe permitir la carga masiva de requisitos por lotes. Endpoint: `POST /api/requirements/import`.
- **RF-07 (Detección de Ambigüedad):** `[IMPLEMENTADO EN BACKEND]` Antes de la generación, el validador analiza criterios de aceptación y estructura.
- **RF-07b (Diseño Manual Autónomo de Pruebas):** `[IMPLEMENTADO EN BACKEND]` El sistema permite al analista QA crear, editar y clonar casos de prueba manualmente desde cero sin utilizar IA ni generadores automáticos. Endpoints: `POST /api/test-cases`, `PUT /api/test-cases/:id`, `POST /api/test-cases/:id/clone`.
- **RF-07c (Generación Heurística Determinista sin IA):** `[IMPLEMENTADO EN BACKEND]` El sistema incorpora un motor de reglas formales ISTQB (partición de equivalencia, análisis de valores límite y reglas de decisión) que opera 100% offline con 0 consumo de tokens ni llamadas de red. Endpoint: `POST /api/heuristics/generate`.

### 3.4 Módulo de Generación Asistida con IA (Acelerador Opcional)
- **RF-08 (Orquestación de Generación de Pruebas):** `[IMPLEMENTADO EN BACKEND]` El backend envía el requisito al proveedor LLM configurado (Google Gemini, OpenAI o Mock) usando prompt base versionado `v1.0` y esquema JSON estricto. Endpoint: `POST /api/ai/generate`.
- **RF-09 (Clasificación de Escenarios de Prueba):** `[IMPLEMENTADO EN BACKEND]` La IA estructura los casos generados en 5 categorías obligatorias: *positivos, negativos, alternativos, valores límite y validación*.
- **RF-10 (Control de Evidencia y Clasificación de Alucinaciones):** `[IMPLEMENTADO EN BACKEND]` Cada caso generado incluye obligatoriamente su estado de evidencia (`derived`, `suggested`, `ambiguous`, `conflict`) y la cita textual de respaldo.
- **RF-11 (Estructura Canónica del Caso):** `[IMPLEMENTADO EN BACKEND]` Cada caso contiene: `CP-XXX`, título, precondiciones (JSON array), pasos de ejecución (JSON array), datos de prueba, resultado esperado, prioridad y fragmento de evidencia.

### 3.5 Módulo de Revisión Humana y Flujo de Aprobación
- **RF-12 (Máquina de Estados de Revisión):** `[IMPLEMENTADO EN BACKEND]` Los casos inician en `PENDING` y pasan a `APPROVED`, `MODIFIED` o `REJECTED` mediante decisión del revisor. Endpoint: `PATCH /api/test-cases/:id/review`.
- **RF-13 (Edición en Línea):** `[IMPLEMENTADO EN BACKEND]` El QA puede modificar pasos, datos y resultados esperados al revisar. Endpoint: `PATCH /api/test-cases/:id/review`.
- **RF-14 (Regeneración Controlada con Historial):** `[IMPLEMENTADO EN BACKEND]` Se conserva el historial completo de generaciones previas para comparar modelos y costos. Endpoint: `GET /api/ai/history/:requirementId`.

### 3.6 Módulo de Auditoría, Tokens y Costos
- **RF-15 (Registro Exhaustivo de Consumo de IA):** `[IMPLEMENTADO EN BACKEND]` Registro transaccional en tabla `ai_generations`: proveedor, modelo, prompt_version, input_tokens, output_tokens, tiempo de respuesta en ms y costo estimado en USD según tarifa oficial.

### 3.7 Módulo de Trazabilidad y Métricas
- **RF-16 (Matriz de Trazabilidad Requisito–Caso):** `[IMPLEMENTADO EN BACKEND]` Generación de matriz bidireccional y porcentaje de cobertura del proyecto. Endpoint: `GET /api/traceability/:projectId`.
- **RF-17 (Dashboard de Métricas Científicas/ISTQB):** `[IMPLEMENTADO EN BACKEND]` Cálculo de tasas ISTQB (aprobación, modificación, rechazo), calidad de evidencia y balance económico de tokens/costos. Endpoint: `GET /api/metrics/project/:projectId`.
- **RF-17b (Métricas de Fuentes de Origen):** `[IMPLEMENTADO EN BACKEND]` Comparación científica y desglose de casos por origen (`MANUAL` vs. `RULE_BASED` vs. `AI_GENERATED`) para evaluar la eficacia y aporte real de la IA frente a métodos tradicionales.

### 3.8 Módulo de Exportación
- **RF-18 (Exportación Multiformato):** `[IMPLEMENTADO EN BACKEND]` Exportación en formatos JSON, CSV (compatible con Jira Xray / TestRail) y Markdown para informes técnicos. Endpoint: `GET /api/export/:projectId?format=json|csv|markdown`.

---

## 4. Requisitos No Funcionales (RNF)

| Código | Categoría | Criterio de Aceptación |
|---|---|---|
| **RNF-01** | **Rendimiento** | La generación asistida de casos para un requisito estándar debe completarse en menos de 15 segundos en condiciones normales de API. Las consultas de interfaz deben responder en menos de 500 ms. |
| **RNF-02** | **Seguridad** | Las claves de API de los proveedores de IA residen exclusivamente en variables de entorno del servidor. Ningún token de proveedor debe ser expuesto al navegador. |
| **RNF-03** | **Integridad de Datos** | La base de datos debe asegurar integridad referencial en cascada: la eliminación de un proyecto o requisito debe gestionar el archivado seguro sin generar casos huérfanos. |
| **RNF-04** | **Tolerancia a Fallos** | Si un proveedor de IA sufre un timeout (límite 30s) o devuelve error de cuota/rate-limit, el sistema debe capturar la excepción limpiamente, registrar el error y notificar al usuario sin degradar la aplicación. |
| **RNF-05** | **Auditabilidad** | Cada cambio de estado de un caso de prueba debe registrar autor (`reviewer_id`), fecha y hora (`timestamp`) y cambios efectuados (`diff`). |
| **RNF-06** | **Usabilidad** | La interfaz debe ser intuitiva, con jerarquía visual moderna, estados de carga (skeletons), retroalimentación inmediata (toasts/notificaciones) y navegación accesible. |
| **RNF-07** | **Portabilidad** | Toda la solución debe ser ejecutable en contenedores Docker y orquestable mediante Docker Compose para facilitar su despliegue en entornos locales (Windows/Linux) o servidores cloud. |

---

## 5. Reglas de Negocio (RN)

1. **RN-01 (Principio Human-in-the-Loop):** Ningún caso de prueba generado por IA es considerado oficial ni exportable hasta haber sido explícitamente revisado y aprobado por un usuario con rol de QA.
2. **RN-02 (Trazabilidad Estricta):** Todo caso de prueba debe estar inequívocamente vinculado a un requisito existente. No se admiten casos independientes sin origen funcional.
3. **RN-03 (Preservación del Original):** Cuando un QA edita un caso de prueba generado por la IA, el contenido original generado debe persistirse en el historial de revisiones para fines comparativos y de investigación.
4. **RN-04 (Versionado de Requisitos):** Si la descripción o criterios de aceptación de un requisito cambian, sus casos previamente aprobados deben marcarse automáticamente con la bandera `REQUIRES_RE-REVIEW` (Requiere nueva revisión).
5. **RN-05 (Tratamiento de Supuestos):** Si un escenario de prueba se basa en una regla no explícita, la IA debe etiquetarlo como `suggested`. El aprobador debe confirmar si el supuesto es válido con el analista de negocio antes de aprobarlo.
6. **RN-06 (Estimación Determinista de Costos):** El cálculo monetario de cada consulta de IA debe utilizar tablas de precios configurables en el backend (por millón de tokens) y no delegarse a estimaciones del cliente.
