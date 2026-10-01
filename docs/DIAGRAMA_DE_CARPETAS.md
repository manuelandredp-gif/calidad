# Estructura del Proyecto y Diagrama de Carpetas — TestGenAI MVP Real

**Arquitectura:** Monolito Modular por Capas (Hexagonal / Clean Architecture)  
**Tecnologías:** Frontend SPA (HTML5 / Vanilla CSS / ES Modules) + Backend API REST (Node.js / Express / TypeScript / Prisma) + PostgreSQL 16  
**Fecha:** Octubre 2026  

---

## 1. Estructura General del Repositorio

```text
CALIDAD/
├── docker-compose.yml               # Orquestación de PostgreSQL 16 y la aplicación en puerto 4000
├── README.md                        # Guía operativa de arranque, configuración y administración
├── README_FLORES_DONGO.md           # Documento académico marco de referencia
│
├── docs/                            # Documentación técnica del MVP
│   ├── API_ENDPOINTS.md             # Contrato de endpoints REST /api/v1
│   ├── ARQUITECTURA_TECNICA.md      # Diseño hexagonal, componentes y flujo de datos
│   ├── DIAGRAMA_DE_CARPETAS.md      # Este documento: Estructura real de directorios
│   ├── MODELO_DATOS.md              # Esquema relacional PostgreSQL, ERD e invariantes
│   └── REQUERIMIENTOS.md            # Alcance funcional RF-01 al RF-14 del MVP
│
├── backend/                         # Servidor API REST y Orquestación de IA
│   ├── Dockerfile                   # Construcción multi-stage de producción (usuario nodejs)
│   ├── package.json                 # Scripts de compilación, tests, admin CLI y dependencias
│   ├── tsconfig.json                # Configuración TypeScript estricta
│   ├── .env.example                 # Plantilla limpia de variables de entorno (sin secretos)
│   │
│   ├── prisma/                      # Persistencia y Migraciones
│   │   ├── schema.prisma            # Esquema único consolidado para PostgreSQL
│   │   ├── migrations/              # Migraciones versionadas (20261001000000_init_postgresql)
│   │   └── backup/                  # Resguardo histórico (dev-db-export.json)
│   │
│   ├── scripts/                     # Herramientas CLI de mantenimiento
│   │   ├── create-admin.ts          # Asistente CLI para registrar el administrador inicial
│   │   ├── data-maintenance.ts      # Diagnóstico (--dry-run) y purga de demos verificadas
│   │   └── inspect-db.ts            # Inspección rápida del estado de tablas
│   │
│   ├── src/                         # Código fuente del backend
│   │   ├── main.ts                  # Arranque del servidor Express y montaje de middlewares
│   │   │
│   │   ├── application/             # Casos de Uso de Aplicación
│   │   │   └── use-cases/
│   │   │       ├── generate-test-cases.use-case.ts # Orquestación de IA, validación y persistencia
│   │   │       └── review-test-case.use-case.ts    # Auditoría humana con control optimista
│   │   │
│   │   ├── common/                  # Componentes transversales
│   │   │   ├── errors/              # Jerarquía tipada de errores (ApiError, DomainSecurityException)
│   │   │   ├── middleware/          # Middlewares (auth, csrf, error-handler, rate-limit)
│   │   │   ├── security/            # Seguridad (cookie-session, pii-masker, prompt-guard)
│   │   │   └── utils/               # Utilidades de resiliencia y verificación (ownership, retry)
│   │   │
│   │   ├── config/                  # Configuraciones del sistema
│   │   │   ├── ai-pricing.ts        # Tarifas oficiales versionadas por millón de tokens
│   │   │   ├── env.ts               # Validación Zod de variables de entorno al arranque
│   │   │   ├── prisma.ts            # Cliente Prisma singleton
│   │   │   └── swagger.ts           # Especificación OpenAPI /api/docs
│   │   │
│   │   ├── core/                    # Dominio y Abstracciones (Hexagonal)
│   │   │   ├── adapters/            # Adaptadores reales de IA (GeminiAdapter, OpenAIAdapter)
│   │   │   ├── domain/              # Entidades ricas, Value Objects y Mappers
│   │   │   ├── ports/               # Interfaces de puertos (IAIProvider, ITestCaseRepository)
│   │   │   └── prompts/             # Ingeniería de prompts QA estandarizados ISTQB
│   │   │
│   │   ├── infrastructure/          # Adaptadores de infraestructura
│   │   │   └── repositories/        # Implementación de repositorios con Prisma Client
│   │   │
│   │   └── modules/                 # Módulos funcionales de la API (Router + Service)
│   │       ├── ai-generation/       # Rutas /api/v1/ai (generar, regenerar, historial)
│   │       ├── auth/                # Rutas /api/v1/auth (register, login, refresh, logout, me)
│   │       ├── config/              # Rutas /api/v1/config (proveedores reales, preferencias)
│   │       ├── export/              # Rutas /api/v1/export (CSV, JSON, Markdown de aprobados)
│   │       ├── metrics/             # Rutas /api/v1/metrics (cobertura, costos, latencia)
│   │       ├── projects/            # Rutas /api/v1/projects (CRUD, archivado)
│   │       ├── requirements/        # Rutas /api/v1/requirements (CRUD, importación, ambigüedad)
│   │       ├── test-cases/          # Rutas /api/v1/test-cases (listado, revisión individual)
│   │       ├── traceability/        # Rutas /api/v1/traceability (matriz de cobertura)
│   │       └── users/               # Rutas /api/v1/users (administración de cuentas para ADMIN)
│   │
│   └── tests/                       # Suite automatizada de pruebas unitarias y de arquitectura
│       ├── setup.ts                 # Configuración de entorno de pruebas
│       ├── architecture.test.ts     # Pruebas de reglas de arquitectura limpia
│       ├── auth.test.ts             # Pruebas de autenticación y hashing
│       ├── export.service.test.ts   # Pruebas de exportación CSV/JSON/Markdown
│       ├── metrics.service.test.ts  # Pruebas de cálculo de métricas y economía
│       ├── pagination.test.ts       # Pruebas de utilidades de paginación
│       ├── property-based.test.ts   # Pruebas de invariantes (PII, PromptGuard, detectores)
│       ├── retry.test.ts            # Pruebas de reintentos exponenciales
│       └── security-guardrails.test.ts # Pruebas de guardrails de seguridad
│
└── frontend/                        # Cliente Web SPA (HTML / CSS / JS Vanilla)
    ├── index.html                   # Documento raíz con las 7 vistas principales
    ├── css/                         # Hojas de estilo modulares
    │   ├── base.css                 # Reset, layout y tipografía
    │   ├── variables.css            # Tokens de color, espaciado y tema
    │   ├── premium.css              # Estilos sobrios de vistas y modales
    │   ├── accessibility.css        # Contraste, accesibilidad y modales accesibles
    │   └── components/              # Estilos de botones, badges, tablas y formularios
    │
    └── js/                          # Lógica frontend en ES Modules
        ├── api.js                   # Cliente API HTTP unificado con cookies HttpOnly
        ├── app.js                   # Enrutamiento de vistas y ciclo de vida de la aplicación
        ├── store.js                 # Estado reactivo local (usuario, proyecto activo)
        ├── theme-manager.js         # Selector de tema claro/oscuro
        ├── accessibility.js         # Trampa de foco y manejo de teclado en modales
        │
        ├── modals/                  # Modales interactivos
        │   ├── ai-modals.js         # Modal de generación con proveedores reales
        │   ├── project-modals.js    # Modal de creación y edición de proyectos
        │   ├── requirement-modals.js# Modal de creación/edición e importación CSV
        │   └── testcase-modals.js   # Modal de auditoría humana individual
        │
        └── views/                   # Vistas principales del sistema
            ├── auth.js              # Vista de autenticación (Login / Registro QA_TESTER)
            ├── dashboard.js         # Vista de Inicio / Resumen del proyecto activo
            ├── projects.js          # Vista de gestión de Proyectos
            ├── requirements.js      # Vista de Requisitos con alertas de ambigüedad
            ├── testCases.js         # Vista de Casos de Prueba con historial de revisión
            ├── traceability.js      # Vista de Matriz de Trazabilidad y Exportación
            ├── metrics.js           # Vista de Métricas de Calidad y Consumo de IA
            └── settings.js          # Vista de Configuración y Gestión de Usuarios ADMIN
```
