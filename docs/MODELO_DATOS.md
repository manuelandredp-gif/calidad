# Modelo de Datos y Esquema Relacional — TestGenAI MVP Real

**Motor de Base de Datos:** PostgreSQL 15+ / 16  
**ORM:** Prisma ORM  
**Versión del Esquema:** 1.0 (Consolidado MVP)  
**Fecha:** Octubre 2026  

---

## 1. Diagrama Entidad-Relación Consolidado

```mermaid
erDiagram
    USERS ||--o{ PROJECTS : "crea / administra"
    USERS ||--o{ TEST_CASE_REVIEWS : "audita / revisa"
    USERS ||--o{ AUTH_SESSIONS : "mantiene sesiones"
    USERS ||--o{ AI_GENERATIONS : "solicita"
    
    PROJECTS ||--o{ REQUIREMENTS : "agrupa"
    REQUIREMENTS ||--o{ REQUIREMENT_VERSIONS : "historial de versiones"
    REQUIREMENTS ||--o{ AI_GENERATIONS : "ejecuciones de IA"
    REQUIREMENTS ||--o{ TEST_CASES : "casos generados"
    
    AI_GENERATIONS ||--o{ TEST_CASES : "origen de generación"
    TEST_CASES ||--o{ TEST_CASE_REVIEWS : "historial de revisiones"

    USERS {
        uuid id PK
        varchar email UK
        varchar passwordHash
        varchar fullName
        varchar role "QA_TESTER | QA_LEAD | DEVELOPER | ADMIN"
        boolean isActive
        json preferences
        timestamptz createdAt
        timestamptz updatedAt
    }

    AUTH_SESSIONS {
        uuid id PK
        uuid userId FK
        varchar tokenHash UK
        timestamptz expiresAt
        boolean isRevoked
        timestamptz createdAt
    }

    PROJECTS {
        uuid id PK
        varchar name
        text description
        uuid ownerId FK
        varchar status "ACTIVE | ARCHIVED"
        integer nextRequirementNumber "Contador correlativo atómico"
        timestamptz createdAt
        timestamptz updatedAt
    }

    REQUIREMENTS {
        uuid id PK
        uuid projectId FK
        varchar code "REQ-001"
        varchar title
        text description
        text acceptanceCriteria
        integer version "Versionado atómico"
        integer nextCaseNumber "Contador correlativo atómico"
        varchar status "ACTIVE | ARCHIVED | OBSOLETE"
        timestamptz createdAt
        timestamptz updatedAt
    }

    REQUIREMENT_VERSIONS {
        uuid id PK
        uuid requirementId FK
        integer version
        varchar title
        text description
        text acceptanceCriteria
        uuid changedById FK
        timestamptz createdAt
    }

    AI_GENERATIONS {
        uuid id PK
        uuid requirementId FK
        uuid requestedById FK
        varchar provider "gemini | openai"
        varchar model
        varchar promptVersion
        integer requirementVersion
        json inputPrompt
        json outputRaw
        varchar status "PENDING | SUCCEEDED | FAILED"
        text errorMessage
        integer inputTokens
        integer outputTokens
        float estimatedCost
        integer responseTimeMs
        varchar cacheKeyHash
        timestamptz createdAt
    }

    TEST_CASES {
        uuid id PK
        uuid requirementId FK
        uuid generationId FK "Opcional si es migrado/manual"
        varchar code "CP-001"
        varchar type "positive | negative | alternative | boundary | validation"
        varchar title
        json preconditions "Array de strings"
        json steps "Array de strings"
        text testData
        text expectedResult
        varchar priority "low | medium | high | critical"
        varchar status "PENDING | APPROVED | REJECTED | MODIFIED"
        integer version "Control optimista de versión"
        varchar source "AI_GENERATED | MANUAL | RULE_BASED"
        varchar evidenceStatus "derived | suggested | ambiguous | conflict | pending"
        text evidenceText
        boolean isObsolete
        integer requirementVersion
        json originalContent "Inmutable"
        timestamptz createdAt
        timestamptz updatedAt
    }

    TEST_CASE_REVIEWS {
        uuid id PK
        uuid testCaseId FK
        uuid reviewerId FK
        varchar decision "APPROVED | REJECTED | MODIFIED"
        text comments
        integer requirementVersion
        json previousContent "Snapshot antes"
        json newContent "Snapshot después"
        timestamptz createdAt
    }
```

---

## 2. Invariantes del Modelo de Persistencia

1. **Unicidad de Códigos Secuenciales:**
   - `Requirement.code` es único por proyecto: `@@unique([projectId, code])`.
   - `TestCase.code` es único por requisito: `@@unique([requirementId, code])`.
   - La asignación de correlativos (`REQ-XXX`, `CP-XXX`) utiliza contadores reservados atómicamente (`nextRequirementNumber`, `nextCaseNumber`) mediante transacciones `SELECT ... FOR UPDATE` para evitar colisiones ante peticiones concurrentes.

2. **Tipos Nativos JSON:**
   - Se utiliza el tipo `Json` nativo de PostgreSQL para `preconditions`, `steps`, `originalContent`, `previousContent`, `newContent`, `inputPrompt` y `outputRaw`.
   - Se eliminaron las conversiones manuales ambiguas de cadenas de texto y delimitadores inconsistentes.

3. **Inmutabilidad y Procedencia:**
   - Todo caso generado por IA conserva su referencia a `AiGeneration` mediante `generationId`.
   - `originalContent` almacena la respuesta original generada por la IA y no se sobreescribe al editar el caso.
   - Cada edición o decisión de revisión genera un registro inmutable en `TestCaseReview` con snapshots completos del estado anterior y posterior.

4. **Versionado de Requisitos e Historial de Obsolescencia:**
   - Cada actualización significativa en título, descripción o criterios de aceptación incrementa `version` y crea un snapshot en `RequirementVersion`.
   - Los casos de prueba asociados a la versión anterior quedan marcados como `isObsolete = true`, requiriendo re-evaluación por parte del equipo QA.
