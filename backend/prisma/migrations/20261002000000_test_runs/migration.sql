-- CreateTable
CREATE TABLE "test_runs" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "environment" TEXT NOT NULL DEFAULT 'QA Sandbox',
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "test_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_execution_results" (
    "id" TEXT NOT NULL,
    "test_run_id" TEXT NOT NULL,
    "test_case_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "duration_seconds" INTEGER NOT NULL DEFAULT 0,
    "executed_at" TIMESTAMP(3),
    "executed_by" TEXT,
    "evidence_text" TEXT,
    "defect_notes" TEXT,
    "defect_logged" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "test_execution_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "test_runs_project_id_idx" ON "test_runs"("project_id");

-- CreateIndex
CREATE INDEX "test_runs_status_idx" ON "test_runs"("status");

-- CreateIndex
CREATE INDEX "test_execution_results_test_run_id_idx" ON "test_execution_results"("test_run_id");

-- CreateIndex
CREATE INDEX "test_execution_results_test_case_id_idx" ON "test_execution_results"("test_case_id");

-- CreateIndex
CREATE INDEX "test_execution_results_status_idx" ON "test_execution_results"("status");

-- AddForeignKey
ALTER TABLE "test_runs" ADD CONSTRAINT "test_runs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_execution_results" ADD CONSTRAINT "test_execution_results_test_run_id_fkey" FOREIGN KEY ("test_run_id") REFERENCES "test_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_execution_results" ADD CONSTRAINT "test_execution_results_test_case_id_fkey" FOREIGN KEY ("test_case_id") REFERENCES "test_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

