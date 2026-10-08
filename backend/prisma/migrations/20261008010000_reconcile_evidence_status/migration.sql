-- Preserve evidence values from databases created with the legacy camelCase name.
-- Fresh databases already have the mapped snake_case column and require no change.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'test_cases'
          AND column_name = 'evidence_status'
    ) THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'test_cases'
              AND column_name = 'evidenceStatus'
        ) THEN
            ALTER TABLE "public"."test_cases"
                RENAME COLUMN "evidenceStatus" TO "evidence_status";
        ELSE
            ALTER TABLE "public"."test_cases"
                ADD COLUMN "evidence_status" TEXT NOT NULL DEFAULT 'pending';
        END IF;
    END IF;
END $$;
