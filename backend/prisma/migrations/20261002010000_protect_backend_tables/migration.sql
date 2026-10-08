-- TestGenAI authorizes access in its backend, not through Supabase Data API.
-- PostgreSQL owner/superuser connections retain access; API roles have no policies.
ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."auth_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."requirements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."requirement_versions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ai_generations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."test_cases" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."test_case_reviews" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."test_runs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."test_execution_results" ENABLE ROW LEVEL SECURITY;
