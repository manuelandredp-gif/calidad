-- Migracion adaptada para PostgreSQL local (sin Supabase Auth)
-- Simula el esquema auth necesario para que la migracion funcione

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Esquema auth simulado
CREATE SCHEMA IF NOT EXISTS auth;

CREATE TABLE auth.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  encrypted_password text NOT NULL DEFAULT '',
  raw_user_meta_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Funcion auth.uid() simulada (para RLS en local usa current_setting)
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT current_setting('app.current_user_id', true)::uuid;
$$;

-- Perfiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  last_project_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)));
  RETURN new;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Proyectos
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX projects_owner_idx ON public.projects (owner_id);

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_last_project_fk
  FOREIGN KEY (last_project_id) REFERENCES public.projects (id) ON DELETE SET NULL;

-- Versiones del conjunto de requisitos
CREATE TABLE public.requirement_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  version int NOT NULL CHECK (version >= 1),
  raw_text text NOT NULL DEFAULT '' CHECK (char_length(raw_text) <= 51200),
  note text CHECK (char_length(note) <= 280),
  engine_version text NOT NULL,
  text_hash text,
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_draft boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, version)
);
CREATE UNIQUE INDEX one_draft_per_project ON public.requirement_sets (project_id) WHERE is_draft;

-- Decisiones sobre sospechas
CREATE TABLE public.finding_decisions (
  set_id uuid NOT NULL REFERENCES public.requirement_sets (id) ON DELETE CASCADE,
  finding_key text NOT NULL CHECK (char_length(finding_key) <= 120),
  status text NOT NULL CHECK (status IN ('aceptado', 'rechazado')),
  decided_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (set_id, finding_key)
);

-- Configuracion de reglas y diccionario
CREATE TABLE public.rule_overrides (
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  rule_id text NOT NULL CHECK (rule_id ~ '^[A-Z]{3}-\d{2}$'),
  enabled boolean NOT NULL,
  PRIMARY KEY (project_id, rule_id)
);

CREATE TABLE public.domain_terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  term text NOT NULL CHECK (char_length(term) BETWEEN 1 AND 60)
);
CREATE UNIQUE INDEX domain_terms_unique ON public.domain_terms (project_id, lower(term));

-- updated_at automatico
CREATE FUNCTION public.touch_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN new.updated_at = now(); RETURN new; END; $$;
CREATE TRIGGER projects_touch BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER sets_touch BEFORE UPDATE ON public.requirement_sets FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Funcion de pertenencia
CREATE FUNCTION public.owns_project(pid uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (SELECT 1 FROM public.projects p WHERE p.id = pid AND p.owner_id = (SELECT auth.uid()));
$$;

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requirement_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finding_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rule_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domain_terms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "perfil propio: leer" ON public.profiles FOR SELECT TO PUBLIC USING (id = (SELECT auth.uid()));
CREATE POLICY "perfil propio: editar" ON public.profiles FOR UPDATE TO PUBLIC USING (id = (SELECT auth.uid())) WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "proyectos propios" ON public.projects FOR ALL TO PUBLIC
  USING (owner_id = (SELECT auth.uid())) WITH CHECK (owner_id = (SELECT auth.uid()));

CREATE POLICY "versiones de proyectos propios" ON public.requirement_sets FOR ALL TO PUBLIC
  USING (public.owns_project(project_id)) WITH CHECK (public.owns_project(project_id));

CREATE POLICY "decisiones de proyectos propios" ON public.finding_decisions FOR ALL TO PUBLIC
  USING (public.owns_project((SELECT project_id FROM public.requirement_sets s WHERE s.id = set_id)))
  WITH CHECK (public.owns_project((SELECT project_id FROM public.requirement_sets s WHERE s.id = set_id)));

CREATE POLICY "reglas de proyectos propios" ON public.rule_overrides FOR ALL TO PUBLIC
  USING (public.owns_project(project_id)) WITH CHECK (public.owns_project(project_id));

CREATE POLICY "diccionario de proyectos propios" ON public.domain_terms FOR ALL TO PUBLIC
  USING (public.owns_project(project_id)) WITH CHECK (public.owns_project(project_id));

-- Guardar version
CREATE FUNCTION public.save_version(pid uuid, p_note text)
RETURNS int LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE d public.requirement_sets; nid uuid;
BEGIN
  SELECT * INTO d FROM public.requirement_sets WHERE project_id = pid AND is_draft FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sin borrador'; END IF;
  UPDATE public.requirement_sets SET is_draft = false, note = p_note WHERE id = d.id;
  INSERT INTO public.requirement_sets (project_id, version, raw_text, engine_version, text_hash, summary, is_draft)
  VALUES (pid, d.version + 1, d.raw_text, d.engine_version, d.text_hash, d.summary, true)
  RETURNING id INTO nid;
  INSERT INTO public.finding_decisions (set_id, finding_key, status)
  SELECT nid, finding_key, status FROM public.finding_decisions WHERE set_id = d.id;
  RETURN d.version;
END; $$;
