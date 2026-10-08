-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "next_use_case_number" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "requirements" ADD COLUMN     "derivation_hints" JSONB,
ADD COLUMN     "use_case_id" TEXT;

-- AlterTable
ALTER TABLE "test_cases" ADD COLUMN     "technique" TEXT;

-- CreateTable
CREATE TABLE "spec_generations" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "user_id" TEXT,
    "engine_version" TEXT NOT NULL,
    "depth" TEXT NOT NULL DEFAULT 'standard',
    "input_name" TEXT NOT NULL,
    "input_description" TEXT NOT NULL,
    "input_hash" TEXT NOT NULL,
    "actors_detected" JSONB NOT NULL DEFAULT '[]',
    "modules_detected" JSONB NOT NULL DEFAULT '[]',
    "entities_detected" JSONB NOT NULL DEFAULT '[]',
    "warnings" JSONB NOT NULL DEFAULT '[]',
    "use_cases_created" INTEGER NOT NULL DEFAULT 0,
    "requirements_created" INTEGER NOT NULL DEFAULT 0,
    "test_cases_created" INTEGER NOT NULL DEFAULT 0,
    "use_cases_skipped" INTEGER NOT NULL DEFAULT 0,
    "requirements_skipped" INTEGER NOT NULL DEFAULT 0,
    "duration_ms" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'SUCCEEDED',
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "spec_generations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "use_cases" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "generation_id" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "module_key" TEXT NOT NULL,
    "module_name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "preconditions" JSONB NOT NULL DEFAULT '[]',
    "main_flow" JSONB NOT NULL DEFAULT '[]',
    "alternative_flows" JSONB NOT NULL DEFAULT '[]',
    "exception_flows" JSONB NOT NULL DEFAULT '[]',
    "postconditions" JSONB NOT NULL DEFAULT '[]',
    "source" TEXT NOT NULL DEFAULT 'AUTO_SPEC',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "use_cases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "spec_generations_project_id_idx" ON "spec_generations"("project_id");

-- CreateIndex
CREATE INDEX "spec_generations_user_id_idx" ON "spec_generations"("user_id");

-- CreateIndex
CREATE INDEX "use_cases_project_id_idx" ON "use_cases"("project_id");

-- CreateIndex
CREATE INDEX "use_cases_generation_id_idx" ON "use_cases"("generation_id");

-- CreateIndex
CREATE UNIQUE INDEX "use_cases_project_id_code_key" ON "use_cases"("project_id", "code");

-- CreateIndex
CREATE INDEX "requirements_use_case_id_idx" ON "requirements"("use_case_id");

-- CreateIndex
CREATE INDEX "test_cases_source_idx" ON "test_cases"("source");

-- AddForeignKey
ALTER TABLE "requirements" ADD CONSTRAINT "requirements_use_case_id_fkey" FOREIGN KEY ("use_case_id") REFERENCES "use_cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spec_generations" ADD CONSTRAINT "spec_generations_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spec_generations" ADD CONSTRAINT "spec_generations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "use_cases" ADD CONSTRAINT "use_cases_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "use_cases" ADD CONSTRAINT "use_cases_generation_id_fkey" FOREIGN KEY ("generation_id") REFERENCES "spec_generations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Same backend-only access policy as the existing production tables.
ALTER TABLE "public"."spec_generations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."use_cases" ENABLE ROW LEVEL SECURITY;
