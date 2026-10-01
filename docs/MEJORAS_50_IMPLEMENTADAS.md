# [HISTÓRICO / ANTECEDENTES] Registro de Mejoras Experimentales Previas

> ⚠️ **Nota de Consolidación (Octubre 2026):**  
> Este documento se conserva exclusivamente como antecedente histórico de la fase de prototipado previo. Varios componentes aquí descritos (como generadores offline sin IA, adaptadores mock, cola en memoria y micro-agentes experimentales) fueron retirados o consolidados en el **MVP Real de TestGenAI** para cumplir estrictamente con el documento rector `README_FLORES_DONGO.md`.  
> Para la especificación operativa vigente, consulte [README.md](../README.md) y [ARQUITECTURA_TECNICA.md](./ARQUITECTURA_TECNICA.md).

---

## Catálogo de las 50 Mejoras Implementadas

### Dimensión 1: Arquitectura & Procesamiento Asíncrono
1. **#1 Cola de Tareas Asíncronas con Reintentos (`src/queue/job-queue.ts`):** Procesamiento de tareas de fondo en cola concurrente con control de estado (`WAITING`, `ACTIVE`, `COMPLETED`, `FAILED`), reporte porcentual de avance y backoff exponencial.
2. **#2 Streaming Progresivo Server-Sent Events (SSE) (`src/modules/ai-generation/ai-generation.router.ts`):** Endpoint `/api/v1/ai/stream` con transmisión de eventos en tiempo real (`progress`, `case_chunk`, `fallback`, `complete`).
3. **#3 Arquitectura Limpia y Desacoplamiento de Puertos (`src/core/ports/repository.port.ts`):** Definición de contratos `IRepository`, `ITestCaseRepository` y `IRequirementRepository` desacoplados de Prisma/SQL.
4. **#4 Cache Multinivel con Invalidación por Tags (`src/cache/cache-manager.ts`):** Almacén en memoria compatible con L2/Redis, TTL granular e invalidación instantánea mediante etiquetas (`req:id`, `project:id`).
5. **#5 Rate Limiting Distribuido con Token Bucket (`src/common/rate-limiter.ts`):** Control de ráfagas con algoritmo de regeneración de tokens por segundo y cálculo de tiempo de espera (`retryAfterSeconds`).

### Dimensión 2: Inteligencia Artificial, LLMOps & Calidad Heurística
6. **#6 RAG Semántico y Base de Conocimiento QA (`src/ai/semantic-retriever.ts`):** Motor de similitud coseno vectorial de tokens para inyección de directrices Few-Shot (seguridad, pasarelas de pago, BVA).
7. **#7 Crítico de IA Multi-Agente (Generator vs Auditor) (`src/ai/multi-agent-critic.ts`):** Agente supervisor ISTQB que audita precondiciones, pasos y resultados esperados, aplicando correcciones automáticas.
8. **#8 Sanitización y Detección de Prompt Injection (`src/common/security/prompt-guard.ts`):** Interceptor heurístico de seguridad que neutraliza ataques de bypass, anulación de directivas y jailbreaks antes de consultar el LLM.
9. **#9 Métricas Cuantitativas de Alucinación RAGAS (`src/ai/hallucination-metrics.ts`):** Cuantificador de *Faithfulness Score* y detección de términos no fundamentados en el requisito.
10. **#10 Failover y Circuit Breaker Multi-Proveedor LLM (`src/ai/llm-circuit-breaker.ts`):** Circuito triestado (`CLOSED`, `OPEN`, `HALF_OPEN`) con conmutación transparente entre Gemini, OpenAI y motor Heurístico Offline.

### Dimensión 3: Motor Heurístico ISTQB y Generación Determinista
11. **#11 Generador de Tablas de Decisión ISTQB (`src/core/heuristics/decision-table.ts`):** Combinatoria de matrices lógicas $2^n$ de condiciones y acciones con deducción automática a partir de criterios.
12. **#12 Generador de Transición de Estados ISTQB (`src/core/heuristics/state-transition.ts`):** Modelado de ciclo de vida con cobertura 0-Switch, 1-Switch Sequence y detección de transiciones inválidas.
13. **#13 Combinatoria Pairwise / All-Pairs (`src/heuristic/pairwise.ts`):** Algoritmo codicioso de cobertura ortogonal de 2 vías con reducción óptima de combinaciones complejas.
14. **#14 Método de Árbol de Clasificación (CTM) (`src/heuristic/classification-tree.ts`):** Particionamiento del sistema en aspectos de clasificación y clases disjuntas con casos nominales y de rechazo.
15. **#15 Analizador de Ambigüedad ISO/IEC/IEEE 29148 (`src/core/heuristics/ambiguity-detector.ts`):** Detector de términos subjetivos, no verificables y faltas de atomicidad con scoring 0-100 y recomendaciones.

### Dimensión 4: Base de Datos, Persistencia y Escalabilidad
16. **#16 Soft Delete Global y Manejador de Borrado Lógico (`src/common/persistence/soft-delete.ts`):** Filtros y payloads para exclusión por defecto de registros borrados con preservación de auditoría.
17. **#17 Versionado Histórico y Snapshots de Requisitos (`src/services/requirement-versioning.service.ts`):** Registro inmutable de versiones de especificación con trazabilidad de autor y rollback.
18. **#18 Archivado Histórico de Casos de Prueba (`src/services/search-archive.service.ts`):** Segregación entre casos activos en la suite y casos archivados o rechazados.
19. **#19 Búsqueda Full-Text Search (FTS) Indexada (`src/services/search-archive.service.ts`):** Búsqueda ponderada multidimensional con scoring (Código 10x, Título 5x, Resultado 3x, Pasos 1x).
20. **#20 Transacciones Atómicas en Lote (`src/services/batch-transaction.service.ts`):** Segmentación de operaciones masivas en fragmentos atómicos (chunks) para evitar límites de parámetros SQL.

### Dimensión 5: Frontend, UI/UX y Productividad del Tester
21. **#21 Componentización Modular Reactiva con EventBus (`frontend/js/event-bus.js`):** Bus Publish/Subscribe desacoplado para comunicación entre vistas y componentes.
22. **#22 Modo Revisión Rápida en Hoja de Cálculo (Spreadsheet Grid) (`frontend/js/views/grid-review.js`):** Tabla editable compacta con atajos de teclado de alta velocidad (`A`: Aprobar, `R`: Rechazar, `E`: Editar, `↑/↓`: Navegar).
23. **#23 Visor de Diferencias Visuales (Diff Viewer 360°) (`frontend/js/views/diff-viewer.js`):** Comparador visual con resaltado en verde (adición) y rojo (eliminación) entre versiones de prueba y requisitos.
24. **#24 Virtual Scrolling para Listas Masivas (`frontend/js/virtual-scroll.js`):** Renderizado en ventana deslizante para soportar más de 5,000 casos a 60 FPS.
25. **#25 Accesibilidad WCAG 2.1 AA (`frontend/js/accessibility.js`, `frontend/css/accessibility.css`):** Focus trap en modales, enlace directo *Skip to content*, región `aria-live` y diálogo de ayuda de atajos con `?`.

### Dimensión 6: Integraciones, Exportación y Ecosistema QA
26. **#26 Generador de Código Ejecutable (`src/modules/export/code-generators.ts`):** Exportación a Playwright (`.spec.ts`), Cypress (`.cy.ts`) y Cucumber Gherkin (`.feature`) en español.
27. **#27 Conector e Integración con Jira y Xray (`src/integrations/jira-xray.connector.ts`):** Formateo automático de casos tipo `Test` y pasos manuales de Xray con sincronización de ejecuciones.
28. **#28 Conector Azure DevOps y GitHub Issues (`src/integrations/devops-github.connector.ts`):** Formateo estructurado para Azure Test Plans y GitHub Issues con etiquetas automáticas de severidad.
29. **#29 Exportador de Colecciones API Postman / Bruno (`src/modules/export/code-generators.ts`):** Exportación de especificaciones a colecciones Postman Collection v2.1.0 con tests funcionales `pm.test` integrados.
30. **#30 Sincronización Git-as-Source (`src/integrations/git-sync.service.ts`):** Lector y parser de especificaciones de requisitos almacenadas en repositorios Git como archivos Markdown.

### Dimensión 7: Seguridad, Autenticación y Gobernanza
31. **#31 Autenticación de Dos Factores (2FA TOTP) RFC 6238 (`src/security/two-factor.service.ts`):** Generador de secretos Base32, URL compatible con Google Authenticator y validación de tokens de 6 dígitos.
32. **#32 Control de Acceso Granular RBAC (`src/common/security/rbac.ts`):** Matriz estricta de roles (`ADMIN`, `QA_LEAD`, `QA_TESTER`, `DEVELOPER`, `VIEWER`) y permisos por acción.
33. **#33 Enmascaramiento y Anonimización de PII (`src/common/security/pii-masker.ts`):** Detección y ofuscación de correos, tarjetas de crédito, números de documento (DNI) y tokens antes de consultar proveedores externos de IA, con reversibilidad en memoria.
34. **#34 Sesiones Seguras con Cookies HttpOnly (`src/common/security/cookie-session.ts`):** Manejo de sesiones seguras mediante cookies `HttpOnly; SameSite=Strict; Secure` con fallback para `Authorization: Bearer`.
35. **#35 Pista de Auditoría Criptográfica Inmutable (`src/security/audit-trail.ts`):** Registro de auditoría encadenado mediante SHA-256 (Hash Chain) donde cada bloque sella el hash del anterior, detectando alteraciones.

### Dimensión 8: Pruebas Internas, Robustez y Calidad del Software
36. **#36 Suite E2E Completa con Playwright (`tests-e2e/testgenai.spec.ts`, `playwright.config.ts`):** Automatización de extremo a extremo que valida el flujo: login -> navegación -> revisión en grid -> exportación.
37. **#37 Pruebas Basadas en Propiedades (`tests/property-based.test.ts`):** Verificación de invariantes matemáticos (invariante de $2^N$ en tablas de verdad, reversibilidad de PII, acotamiento de Pairwise).
38. **#38 Contract Testing y Validación OpenAPI (`src/common/openapi-validator.ts`):** Verificación de esquemas de respuesta JSON contra especificaciones formales de API.
39. **#39 Configuración de Mutation Testing con Stryker (`stryker.config.json`):** Configuración para inyección de mutantes sobre el motor heurístico y módulos de seguridad.
40. **#40 Pruebas de Carga y Rendimiento Automatizadas con k6 (`load-tests/k6-testgenai.js`):** Simulación de carga de 100 usuarios concurrentes con validación de SLA (p95 < 500ms y tasa de error < 1%).

### Dimensión 9: DevOps, Infraestructura y Observabilidad
41. **#41 Docker Compose Enterprise Unificado (`docker-compose.enterprise.yml`, `deploy/nginx/nginx.conf`):** Orquestación multi-contenedor con PostgreSQL 16 (pgvector), Redis 7, Backend Node.js y Nginx.
42. **#42 Telemetría Distribuida y APM OpenTelemetry (`src/observability/telemetry.ts`):** Instrumentación de Spans para rastreo de latencias de inferencia y operaciones críticas.
43. **#43 Métricas Prometheus y Dashboard Grafana (`src/observability/prometheus.ts`, `deploy/grafana/dashboard.json`):** Exposición de métricas estándar `/metrics` y plantilla visual para Grafana.
44. **#44 Pipeline DevSecOps CI/CD (`.github/workflows/devsecops.yml`):** Flujo de GitHub Actions con Typecheck, ESLint, Vitest, escaneo de vulnerabilidades Trivy y validación Docker.
45. **#45 Helm Charts para Kubernetes (`deploy/helm/testgenai/`):** Manifiestos de despliegue en la nube (`Chart.yaml`, `values.yaml`, `templates/deployment.yaml`).

### Dimensión 10: Analítica Avanzada, Trazabilidad y Gestión QA
46. **#46 Matriz de Trazabilidad 360° (`frontend/js/views/traceability-360.js`):** Visualización bidireccional Requisito ↔ Caso ↔ Script de Automatización ↔ Nivel de Riesgo con exportación CSV.
47. **#47 Calculadora de ROI del Testing (`frontend/js/views/roi-calculator.js`):** Panel interactivo que calcula horas-hombre ahorradas, costo evitado por defectos prevenidos y ROI porcentual.
48. **#48 Colaboración en Tiempo Real y Presencia (`src/realtime/presence-hub.ts`):** Hub de latidos y bloqueo optimista para prevenir colisiones de edición simultánea en casos de prueba.
49. **#49 Detector de Casos de Prueba Obsoletos (`src/services/stale-detector.service.ts`):** Detección heurística de desfase temporal entre actualizaciones de requisitos y casos creados.
50. **#50 Estudio de Benchmarking A/B de Prompts y Modelos (`src/services/ab-benchmark.service.ts`):** Comparador objetivo de calidad lingüística, latencia y costo entre dos candidatos o proveedores de IA.
