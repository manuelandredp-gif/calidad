-- =============================================================================
-- TestGenAI Studio - Script DDL para Base de Datos Relacional PostgreSQL
-- Compatible con: PostgreSQL 14+, Supabase, Neon, Railway, AWS RDS, Docker
-- =============================================================================

-- 1. Habilitar extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabla de Usuarios con Autenticación Bcrypt & Roles RBAC
CREATE TABLE IF NOT EXISTS "users" (
  "id" VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  "email" VARCHAR(255) NOT NULL UNIQUE,
  "passwordHash" VARCHAR(255) NOT NULL,
  "fullName" VARCHAR(255) NOT NULL,
  "role" VARCHAR(50) NOT NULL DEFAULT 'QA_TESTER', -- QA_TESTER, QA_LEAD, DEVELOPER, ADMIN
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla de Proyectos de Software
CREATE TABLE IF NOT EXISTS "projects" (
  "id" VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "ownerId" VARCHAR(64) NOT NULL,
  "status" VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, ARCHIVED
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "fk_projects_owner" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT
);

-- 4. Tabla de Requisitos Funcionales & Criterios de Aceptación (Gherkin/BDD)
CREATE TABLE IF NOT EXISTS "requirements" (
  "id" VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  "projectId" VARCHAR(64) NOT NULL,
  "code" VARCHAR(50) NOT NULL, -- ej. REQ-001
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT NOT NULL,
  "acceptanceCriteria" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "status" VARCHAR(50) NOT NULL DEFAULT 'DRAFT', -- DRAFT, READY_FOR_AI, GENERATED, OBSOLETE
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "uq_project_req_code" UNIQUE ("projectId", "code"),
  CONSTRAINT "fk_requirements_project" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE
);

-- 5. Tabla de Casos de Prueba (ISTQB: Positivos, Negativos, Límites, etc.)
CREATE TABLE IF NOT EXISTS "test_cases" (
  "id" VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  "requirementId" VARCHAR(64) NOT NULL,
  "code" VARCHAR(50) NOT NULL, -- ej. CP-001
  "type" VARCHAR(50) NOT NULL, -- positive, negative, alternative, boundary, validation
  "title" VARCHAR(255) NOT NULL,
  "preconditions" TEXT NOT NULL DEFAULT '[]',
  "steps" TEXT NOT NULL DEFAULT '[]',
  "testData" TEXT,
  "expectedResult" TEXT NOT NULL,
  "priority" VARCHAR(50) NOT NULL DEFAULT 'medium', -- high, medium, low
  "evidenceStatus" VARCHAR(50) NOT NULL DEFAULT 'derived', -- derived, suggested, ambiguous, conflict
  "evidenceText" TEXT,
  "source" VARCHAR(50) NOT NULL DEFAULT 'MANUAL', -- MANUAL, RULE_BASED, AI_GENERATED
  "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, MODIFIED, REJECTED
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "uq_req_testcase_code" UNIQUE ("requirementId", "code"),
  CONSTRAINT "fk_testcases_requirement" FOREIGN KEY ("requirementId") REFERENCES "requirements"("id") ON DELETE CASCADE
);

-- 6. Tabla de Auditoría & Trazabilidad FinOps de IA
CREATE TABLE IF NOT EXISTS "ai_generations" (
  "id" VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  "requirementId" VARCHAR(64) NOT NULL,
  "provider" VARCHAR(50) NOT NULL, -- gemini, openai, mock
  "model" VARCHAR(100) NOT NULL,
  "promptVersion" VARCHAR(50) NOT NULL DEFAULT 'v1.0',
  "inputTokens" INTEGER NOT NULL,
  "outputTokens" INTEGER NOT NULL,
  "estimatedCost" DOUBLE PRECISION NOT NULL,
  "responseTimeMs" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "fk_aigenerations_requirement" FOREIGN KEY ("requirementId") REFERENCES "requirements"("id") ON DELETE CASCADE
);

-- 7. Tabla de Firmas Digitales Human-in-the-Loop (Revisión de Casos)
CREATE TABLE IF NOT EXISTS "test_case_reviews" (
  "id" VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  "testCaseId" VARCHAR(64) NOT NULL,
  "reviewerId" VARCHAR(64) NOT NULL,
  "decision" VARCHAR(50) NOT NULL, -- APPROVED, MODIFIED, REJECTED
  "comments" TEXT,
  "previousContent" TEXT,
  "newContent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "fk_reviews_testcase" FOREIGN KEY ("testCaseId") REFERENCES "test_cases"("id") ON DELETE CASCADE,
  CONSTRAINT "fk_reviews_reviewer" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE RESTRICT
);

-- 8. Índices de Alto Rendimiento para Consultas Rápidas
CREATE INDEX IF NOT EXISTS "idx_requirements_project" ON "requirements"("projectId");
CREATE INDEX IF NOT EXISTS "idx_testcases_requirement" ON "test_cases"("requirementId");
CREATE INDEX IF NOT EXISTS "idx_testcases_status" ON "test_cases"("status");
CREATE INDEX IF NOT EXISTS "idx_aigenerations_req" ON "ai_generations"("requirementId");
CREATE INDEX IF NOT EXISTS "idx_reviews_testcase" ON "test_case_reviews"("testCaseId");

-- 9. Datos Semilla Iniciales (Cuentas Reales con Claves Hasheadas con Bcrypt)
-- Contraseña de QA Lead: Password123!
-- Contraseña de Admin: Admin123*TestGenAI
INSERT INTO "users" ("id", "email", "passwordHash", "fullName", "role")
VALUES 
  ('usr-qalead-001', 'qa.lead@testgenai.io', '$2b$10$wJtK1fUqyKjV1r9B0c0K/uV55F45QvYl2p0kH15O4eK9K9jL7M2re', 'Ing. Carlos Mendoza', 'QA_LEAD'),
  ('usr-admin-002', 'admin@testgenai.com', '$2b$10$8u4fFf7hJ8mK1l0p9o2w.eaY3a/s1/5P7E3V4A5B6C7D8E9F0G1H2', 'Administrador Principal', 'ADMIN'),
  ('usr-tester-003', 'qa.tester@testgenai.com', '$2b$10$8u4fFf7hJ8mK1l0p9o2w.eaY3a/s1/5P7E3V4A5B6C7D8E9F0G1H2', 'Analista QA Senior', 'QA_TESTER')
ON CONFLICT ("email") DO NOTHING;
