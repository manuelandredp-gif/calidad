# Estructura del Proyecto y Diagrama de Carpetas — TestGenAI

**Arquitectura:** Cliente–Servidor Desacoplado (Monorepo Modular)  
**Tecnologías:** Frontend (React / Next.js / TypeScript) + Backend (API REST en Capas / TypeScript o Python) + Base de Datos (PostgreSQL)  
**Fecha:** Septiembre 2026  

---

## 1. Visión General del Árbol de Directorios

La estructura propuesta implementa el principio de **Separación de Responsabilidades (SoC)** y una **Arquitectura en Capas Hexagonal/Limpia**, separando el dominio del negocio, la persistencia en base de datos y la integración de proveedores externos de IA.

```text
CALIDAD/
├── .env.example                     # Plantilla de variables de entorno globales
├── .gitignore                       # Archivos y carpetas ignoradas por git
├── docker-compose.yml               # Orquestación de Frontend, Backend y PostgreSQL
├── README_FLORES_DONGO.md           # Documento marco teórico y académico de tesis
│
├── docs/                            # Documentación técnica y de ingeniería de software
│   ├── REQUERIMIENTOS.md            # Especificación detallada de RF, RNF y Reglas de Negocio
│   ├── DIAGRAMA_DE_CARPETAS.md      # Este documento: Estructura y propósito de archivos
│   ├── ARQUITECTURA_TECNICA.md      # Flujo de datos, diseño de capas y Patrón Adaptador
│   └── MODELO_DATOS.md              # DDL SQL, esquemas de tablas, relaciones e índices
│
├── backend/                         # Servidor API REST y Motor de Orquestación de IA
│   ├── Dockerfile                   # Contenedorización del backend
│   ├── package.json                 # Dependencias y scripts (o requirements.txt / pyproject.toml)
│   ├── tsconfig.json                # Configuración de compilador TypeScript
│   ├── .env.example                 # Variables de entorno específicas del backend
│   │
│   ├── src/                         # Código fuente del backend
│   │   ├── main.ts                  # Punto de entrada de la aplicación y configuración de CORS
│   │   │
│   │   ├── config/                  # Configuraciones globales
│   │   │   ├── database.config.ts   # Conexión a PostgreSQL y pool de conexiones
│   │   │   ├── env.validation.ts    # Validación de variables de entorno al arranque
│   │   │   └── ai-pricing.ts        # Tablas de tarifas de tokens (Gemini, OpenAI)
│   │   │
│   │   ├── common/                  # Componentes transversales reutilizables
│   │   │   ├── decorators/          # Decoradores personalizados (ej. CurrentUser, Roles)
│   │   │   ├── filters/             # Filtros globales de manejo de excepciones HTTP
│   │   │   ├── guards/              # Guardias de autenticación JWT y roles (RBAC)
│   │   │   ├── interceptors/        # Interceptores de logging de latencia y formateo de respuesta
│   │   │   └── utils/               # Utilidades de cálculo de costos, hashing y strings
│   │   │
│   │   ├── core/                    # Núcleo de Integración con IA (Patrón Adaptador)
│   │   │   ├── interfaces/
│   │   │   │   ├── ai-provider.interface.ts   # Contrato unificado para cualquier LLM
│   │   │   │   └── ai-response.interface.ts   # Esquema estandarizado de respuesta de la IA
│   │   │   ├── adapters/
│   │   │   │   ├── gemini.adapter.ts          # Implementación para Google Gemini API
│   │   │   │   └── openai.adapter.ts          # Implementación para OpenAI API
│   │   │   ├── prompts/
│   │   │   │   ├── system-prompt.v1.ts        # Versión 1 del prompt de ingeniería QA
│   │   │   │   └── prompt-builder.ts          # Constructor dinámico de prompts según requisito
│   │   │   └── validators/
│   │   │       ├── json-schema.validator.ts   # Validación de salida estructurada del LLM
│   │   │       └── duplicate-detector.ts      # Detección determinista de casos duplicados
│   │   │
│   │   └── modules/                 # Módulos funcionales de negocio (arquitectura modular)
│   │       ├── auth/                # Módulo de Autenticación
│   │       │   ├── auth.controller.ts
│   │       │   ├── auth.service.ts
│   │       │   ├── auth.module.ts
│   │       │   ├── dto/             # LoginDto, RegisterDto
│   │       │   └── strategies/      # JwtStrategy, LocalStrategy
│   │       │
│   │       ├── projects/            # Módulo de Proyectos
│   │       │   ├── projects.controller.ts
│   │       │   ├── projects.service.ts
│   │       │   ├── projects.module.ts
│   │       │   ├── dto/             # CreateProjectDto, UpdateProjectDto
│   │       │   └── entities/        # Project.entity.ts
│   │       │
│   │       ├── requirements/        # Módulo de Requisitos Funcionales
│   │       │   ├── requirements.controller.ts
│   │       │   ├── requirements.service.ts
│   │       │   ├── requirements.module.ts
│   │       │   ├── dto/             # CreateRequirementDto, ImportCsvDto
│   │       │   └── entities/        # Requirement.entity.ts
│   │       │
│   │       ├── test-cases/          # Módulo de Casos de Prueba y Revisión Humana
│   │       │   ├── test-cases.controller.ts
│   │       │   ├── test-cases.service.ts
│   │       │   ├── test-cases.module.ts
│   │       │   ├── dto/             # ApproveCaseDto, ModifyCaseDto, RejectCaseDto
│   │       │   └── entities/        # TestCase.entity.ts, TestCaseReview.entity.ts
│   │       │
│   │       ├── ai-generation/       # Módulo de Generación y Registro de Auditoría
│   │       │   ├── ai-generation.controller.ts
│   │       │   ├── ai-generation.service.ts
│   │       │   ├── ai-generation.module.ts
│   │       │   ├── dto/             # TriggerGenerationDto, RegenerateDto
│   │       │   └── entities/        # AiGeneration.entity.ts
│   │       │
│   │       ├── traceability/        # Módulo de Matriz de Trazabilidad
│   │       │   ├── traceability.controller.ts
│   │       │   ├── traceability.service.ts
│   │       │   └── traceability.module.ts
│   │       │
│   │       ├── metrics/             # Módulo de Estadísticas y Cálculos ISTQB
│   │       │   ├── metrics.controller.ts
│   │       │   ├── metrics.service.ts
│   │       │   └── metrics.module.ts
│   │       │
│   │       └── export/              # Módulo de Exportación (JSON, CSV, Markdown)
│   │           ├── export.controller.ts
│   │           ├── export.service.ts
│   │           └── export.module.ts
│   │
│   └── tests/                       # Pruebas automatizadas del backend
│       ├── unit/                    # Pruebas unitarias de validadores y cálculo de costos
│       ├── integration/             # Pruebas de integración con la base de datos
│       └── e2e/                     # Pruebas End-to-End de los flujos críticos de la API
│
├── frontend/                        # Cliente Web SPA / SSR (React / Next.js)
│   ├── Dockerfile                   # Contenedorización del frontend
│   ├── package.json                 # Dependencias UI, iconos y animaciones
│   ├── tsconfig.json                # Configuración TypeScript
│   ├── next.config.js               # Configuración de Next.js
│   ├── .env.example                 # Variables públicas (NEXT_PUBLIC_API_URL)
│   │
│   ├── public/                      # Archivos estáticos
│   │   ├── icons/                   # Iconos SVG de prueba, estado y trazabilidad
│   │   └── logos/                   # Logotipo oficial de TestGenAI
│   │
│   └── src/                         # Código fuente de la interfaz de usuario
│       ├── app/                     # Rutas y páginas de la aplicación
│       │   ├── layout.tsx           # Layout maestro con tema oscuro/claro y navegación
│       │   ├── page.tsx             # Redirección o landing de bienvenida
│       │   ├── (auth)/
│       │   │   └── login/page.tsx   # Pantalla moderna de inicio de sesión
│       │   ├── (dashboard)/
│       │   │   ├── layout.tsx       # Layout del panel con Sidebar y Header persistentes
│       │   │   ├── page.tsx         # Dashboard general con KPIs (cobertura, costos, aprobación)
│       │   │   ├── projects/
│       │   │   │   ├── page.tsx     # Listado y creación de proyectos
│       │   │   │   └── [id]/page.tsx# Detalle del proyecto y vista resumen
│       │   │   ├── requirements/
│       │   │   │   ├── page.tsx     # Gestión de requisitos e importación CSV
│       │   │   │   └── [id]/page.tsx# Editor de requisito y consola de generación IA
│       │   │   ├── test-cases/
│       │   │   │   └── page.tsx     # Consola de revisión humana (Aprobar/Editar/Rechazar)
│       │   │   ├── traceability/
│       │   │   │   └── page.tsx     # Matriz visual e interactiva de trazabilidad
│       │   │   ├── metrics/
│       │   │   │   └── page.tsx     # Reportes científicos (ISTQB, tokens, latencia, costos)
│       │   │   └── settings/
│       │   │       └── page.tsx     # Configuración de proveedores y umbrales de IA
│       │
│       ├── components/              # Biblioteca de componentes UI reutilizables
│       │   ├── ui/                  # Componentes atómicos de diseño (botones, inputs, badges)
│       │   │   ├── Button.tsx
│       │   │   ├── Badge.tsx        # Etiquetas de tipo de caso (Positivo, Negativo, Límite)
│       │   │   ├── Card.tsx
│       │   │   ├── Modal.tsx
│       │   │   ├── Skeleton.tsx     # Estados de carga elegantes
│       │   │   └── Toast.tsx        # Notificaciones emergentes
│       │   ├── layout/              # Estructuras visuales globales
│       │   │   ├── Sidebar.tsx      # Barra de navegación lateral colapsable
│       │   │   ├── Header.tsx       # Barra superior con usuario activo y acciones rápidas
│       │   │   └── Breadcrumbs.tsx  # Navegación jerárquica
│       │   ├── test-cases/          # Componentes especializados en casos de prueba
│       │   │   ├── TestCaseCard.tsx # Tarjeta interactiva con pasos, datos y evidencia
│       │   │   ├── ReviewActions.tsx# Botonera de Aprobar / Editar / Rechazar
│       │   │   └── EvidenceTag.tsx  # Marcador visual (Derivado / Sugerido / Conflicto)
│       │   ├── charts/              # Visualizaciones de datos y gráficos interactivos
│       │   │   ├── CostChart.tsx    # Gráfico de consumo de tokens y costos por modelo
│       │   │   └── CoverageBar.tsx  # Barra de progreso de cobertura de requisitos
│       │   └── traceability/        # Componentes de matriz de trazabilidad
│       │       └── MatrixTable.tsx  # Tabla matricial con enlaces bidireccionales
│       │
│       ├── hooks/                   # Custom Hooks de React
│       │   ├── useAuth.ts           # Estado global de sesión y permisos
│       │   ├── useProjects.ts       # Operaciones de proyectos
│       │   ├── useTestCases.ts      # Operaciones sobre casos y revisión
│       │   └── useGeneration.ts     # Manejo del estado de generación IA y streaming/loader
│       │
│       ├── services/                # Clientes de consumo de API REST
│       │   ├── api.client.ts        # Instancia Axios/Fetch configurada con interceptor JWT
│       │   ├── auth.service.ts
│       │   ├── projects.service.ts
│       │   ├── requirements.service.ts
│       │   ├── ai.service.ts
│       │   └── metrics.service.ts
│       │
│       ├── types/                   # Definiciones de tipos e interfaces TypeScript
│       │   ├── auth.types.ts
│       │   ├── project.types.ts
│       │   ├── requirement.types.ts
│       │   ├── test-case.types.ts
│       │   └── metrics.types.ts
│       │
│       └── styles/                  # Sistema de diseño y variables CSS
│           ├── globals.css          # Estilos globales y reseteo
│           └── theme.css            # Tokens de diseño (paleta cromática, elevaciones, bordes)
│
└── database/                        # Scripts y Esquema de Base de Datos
    ├── init.sql                     # Script DDL completo de creación de tablas
    ├── seeds.sql                    # Datos iniciales para pruebas (usuario admin, proyecto demo)
    └── migrations/                  # Control de versiones del esquema relacional
```

---

## 2. Descripción de Capas y Responsabilidades

### 2.1 Backend (`/backend/src`)
- **`config/`**: Aísla variables de entorno y precios. Si los precios de los tokens de OpenAI o Google cambian, solo se actualiza el archivo [`ai-pricing.ts`](file:///c:/Users/LENOVO/Desktop/CALIDAD/backend/src/config/ai-pricing.ts).
- **`core/adapters/`**: Implementa el **Patrón Adaptador**. La aplicación no se acopla directamente a una biblioteca de IA. Si se desea cambiar de Gemini a GPT-5 o Claude, solo se implementa la interfaz [`ai-provider.interface.ts`](file:///c:/Users/LENOVO/Desktop/CALIDAD/backend/src/core/interfaces/ai-provider.interface.ts).
- **`modules/`**: Cada módulo de negocio agrupa su propio Controlador (expone endpoints REST), Servicio (contiene lógica de negocio pura) y DTOs (validación de datos de entrada).

### 2.2 Frontend (`/frontend/src`)
- **`app/`**: Estructura basada en App Router moderna de Next.js, permitiendo separación entre rutas públicas de autenticación y rutas privadas del dashboard.
- **`components/ui/`**: Componentes visuales atómicos desacoplados de la lógica de negocio para permitir rediseños visuales sin tocar APIs ni endpoints.
- **`services/`**: Centraliza todas las llamadas HTTP al backend, inyectando automáticamente el token JWT en las cabeceras de autorización.

### 2.3 Base de Datos (`/database`)
- Centraliza los esquemas relacionales, garantizando que el entorno pueda levantarse de cero con `docker-compose up -d` y ejecutar las migraciones iniciales automáticamente.
