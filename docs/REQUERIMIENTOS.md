# Especificación de Requisitos de Software — TestGenAI MVP Real

**Sistema:** TestGenAI  
**Documento Rector:** `README_FLORES_DONGO.md`  
**Versión:** 1.0 (MVP Real Consolidado)  
**Fecha:** Octubre 2026  

---

## 1. Alcance Funcional Obligatorio (MVP)

| Requisito | Nombre | Implementación y Reglas de Negocio |
|---|---|---|
| **RF-01** | Autenticación y Sesión Segura | Registro público forzado a rol `QA_TESTER`. Login mediante credenciales con bcrypt. Sesiones mediante cookies HttpOnly con rotación de refresh token y revocación en la tabla `AuthSession`. Creación de administrador vía script seguro `admin:create`. |
| **RF-02** | Gestión de Proyectos | Crear, listar paginado, consultar detalle y archivar (`ACTIVE` / `ARCHIVED`). Control estricto de propiedad (evita IDOR). Numeración atómica correlativa de requisitos por proyecto. |
| **RF-03** | Gestión de Requisitos e Importación | Registro con código secuencial único (`REQ-XXX`), título, descripción y criterios de aceptación. Importación por lotes validada vía CSV/JSON con reporte de filas. Actualización con incremento de versión y snapshot inmutable en `RequirementVersion`. |
| **RF-04** | Generación Asistida con IA Real | Invocación de Google Gemini u OpenAI configurados con API keys reales. Enmascaramiento bidireccional de PII (`PIIMasker`) y detección de inyecciones (`PromptGuard`). Si no hay proveedor configurado o la llamada falla, se retorna error explícito (HTTP 502/503) sin simuladores ni casos falsos. |
| **RF-05** | Clasificación Estructurada de Casos | Salida validada mediante Zod (`AITestCasesOutputSchema`) en las 5 categorías ISTQB: *positive, negative, alternative, boundary, validation*. Estado inicial de casos: `PENDING`. Clasificación de evidencia: `derived`, `suggested`, `ambiguous`, `conflict`, `pending`. |
| **RF-06** | Auditoría y Revisión Humana Individual | Revisión caso por caso. Permite editar campos del caso. Control de concurrencia optimista con `expectedVersion` (HTTP 409 ante carreras). Registro obligatorio de comentario en rechazo (`REJECTED`) y justificación técnica para aprobar casos con evidencia en conflicto (`conflict`). Snapshot antes/después en `TestCaseReview`. |
| **RF-07** | Trazabilidad Requisito–Caso | Todo caso mantiene su asociación estricta a un requisito y generación de origen. Cálculo de cobertura basado exclusivamente en requisitos activos con al menos un caso aprobado vigente. |
| **RF-08** | Regeneración Preservando Historial | La regeneración crea nuevas ejecuciones en `AiGeneration` y nuevos casos de prueba sin sobreescribir ni eliminar los casos generados o auditados en iteraciones previas. |
| **RF-09** | Métricas de Calidad de Pruebas | Contadores reales de requisitos, casos totales, aprobados, modificados, rechazados y pendientes. Tasas de aprobación calculadas sobre el total del proyecto, no sobre la página visualizada. |
| **RF-10** | Monitoreo y Economía de IA | Registro fidedigno de tokens de entrada y salida, latencia medida en milisegundos y costo real en USD según tarifas oficiales versionadas. Los consumos de llamadas fallidas se registran cuando el proveedor informa el gasto. |
| **RF-11** | Exportación de Casos Aprobados | Descarga de especificaciones en formatos CSV, JSON y Markdown conteniendo únicamente casos aprobados vigentes de requisitos activos. CSV protegido contra inyección de fórmulas. |
| **RF-12** | Historial de Revisiones y Generaciones | Consulta inmutable de ejecuciones de IA por requisito y revisiones históricas del caso de prueba con comparador visual de cambios (antes vs. después). |
| **RF-13** | Detección Básica de Ambigüedad | Análisis estático de términos vagos, cláusulas abiertas y criterios de aceptación insuficientes en el detalle del requisito para advertir al analista QA antes de generar pruebas. |
| **RF-14** | Detección Básica de Duplicados | Comparación normalizada de títulos, pasos y resultados entre casos del mismo requisito para advertir sobre posibles redundancias sin eliminarlas automáticamente. |
| **RF-15** | Diseño Formal ISTQB y Creación Sin IA | Plataforma Dual de Calidad: generación y diseño de casos mediante tres modalidades independientes de IA: 1) **Análisis de Valores Límite (BVA de 3 puntos) y Partición de Equivalencia (EP)** con cálculo matemático automático para variables cuantitativas y longitud de caracteres; 2) **Catálogo de Patrones ISTQB** predefinidos; 3) **Diseño Manual Estructurado** asistido por generador de datos sintéticos reales (Luhn, Módulo 11 SUNAT, DNI, boundary strings). Todos los casos se integran con códigos correlativos atómicos (`CP-XXX`), trazabilidad completa y revisión humana obligatoria (RF-06). |
| **RF-16** | Compendio Técnico de 70 Capacidades Deterministas | Implementación de las **40 propuestas deterministas sin IA** (Tablas de decisión 2^N, Transición de estados 0-switch, Pairwise combinatorio greedy, BVA robusto de 5 puntos y multivariable, árboles de clasificación CTM, casos de uso, taxonomía de fallos Error Guessing, parser sintáctico EARS, compilador BDD Gherkin, extractor regex, RFC 2119, datos sintéticos para Perú/Chile/México/Argentina/España, multimarca Luhn, payloads ASVS, strings extremos, geo-coordenadas, archivos en memoria e IPs) y **30 mejoras de plataforma** (Ciclos de ejecución Test Runs, registro de defectos 1-clic, evidencia y temporizador por caso, métricas en tiempo real, atajos ergonómicos J/K/A/R/E, split-view responsivo, paleta Ctrl+K, firma digital SHA-256 de suites, exportadores BDD Gherkin, Xray JSON, TestRail CSV, IEEE 829 Test Plan, HTML formal, importador OpenAPI 3.0, cifrado AES-256-GCM, caché LRU, modo offline PWA y health check profundo `/api/health/deep`), **manteniendo el panel de navegación principal 100% limpio y sin opciones adicionales**. |

---

## 2. Exclusiones Explícitas Fuera de Alcance

Conforme a la sección 3.2 del plan de consolidación, los siguientes elementos quedan expresamente excluidos del MVP:

- Adaptadores simulados (`mock`) en producción, backend o frontend.
- Cuentas de demostración pre-cargadas o seeds destructivos.
- Aprobación masiva de casos en lote (se exige revisión humana individual).
- Generación de código ejecutable de automatización (Playwright, Cypress, Postman, Bruno).
- Copiloto conversacional de chat, calculadora de ROI hipotético o vista de trazabilidad 360°.
- Sistemas RAG experimentales, crítico multi-agente o métricas presentadas como certificaciones formales ISO/ISTQB.
- Integraciones externas con Jira/Xray, GitHub Issues, Azure DevOps o GitSync.
- Infraestructura empresarial pesada: Redis, BullMQ, WebSockets, Grafana, Prometheus o Kubernetes/Helm.
- Experimento científico automatizado o conclusiones hipotéticas de ahorro de tiempo (la evaluación empírica propuesta en el marco teórico queda como trabajo de investigación independiente).
