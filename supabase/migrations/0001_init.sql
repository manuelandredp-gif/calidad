-- Perfiles
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  last_project_id uuid,
  created_at timestamptz not null default now()
);

create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)));
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Proyectos
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index projects_owner_idx on public.projects (owner_id);

alter table public.profiles
  add constraint profiles_last_project_fk
  foreign key (last_project_id) references public.projects (id) on delete set null;

-- Versiones del conjunto de requisitos
create table public.requirement_sets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  version int not null check (version >= 1),
  raw_text text not null default '' check (char_length(raw_text) <= 51200),
  note text check (char_length(note) <= 280),
  engine_version text not null,
  text_hash text,
  summary jsonb not null default '{}'::jsonb,
  is_draft boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, version)
);
create unique index one_draft_per_project on public.requirement_sets (project_id) where is_draft;

-- Decisiones sobre sospechas
create table public.finding_decisions (
  set_id uuid not null references public.requirement_sets (id) on delete cascade,
  finding_key text not null check (char_length(finding_key) <= 120),
  status text not null check (status in ('aceptado', 'rechazado')),
  decided_at timestamptz not null default now(),
  primary key (set_id, finding_key)
);

-- Configuracion de reglas y diccionario
create table public.rule_overrides (
  project_id uuid not null references public.projects (id) on delete cascade,
  rule_id text not null check (rule_id ~ '^[A-Z]{3}-\d{2}$'),
  enabled boolean not null,
  primary key (project_id, rule_id)
);

create table public.domain_terms (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  term text not null check (char_length(term) between 1 and 60)
);
create unique index domain_terms_unique on public.domain_terms (project_id, lower(term));

-- updated_at automatico
create function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
create trigger projects_touch before update on public.projects for each row execute function public.touch_updated_at();
create trigger sets_touch before update on public.requirement_sets for each row execute function public.touch_updated_at();

-- Funcion de pertenencia (evita repetir el join en cada politica)
create function public.owns_project(pid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.projects p where p.id = pid and p.owner_id = (select auth.uid()));
$$;

-- RLS
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.requirement_sets enable row level security;
alter table public.finding_decisions enable row level security;
alter table public.rule_overrides enable row level security;
alter table public.domain_terms enable row level security;

create policy "perfil propio: leer" on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "perfil propio: editar" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "proyectos propios" on public.projects for all to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

create policy "versiones de proyectos propios" on public.requirement_sets for all to authenticated
  using (public.owns_project(project_id)) with check (public.owns_project(project_id));

create policy "decisiones de proyectos propios" on public.finding_decisions for all to authenticated
  using (public.owns_project((select project_id from public.requirement_sets s where s.id = set_id)))
  with check (public.owns_project((select project_id from public.requirement_sets s where s.id = set_id)));

create policy "reglas de proyectos propios" on public.rule_overrides for all to authenticated
  using (public.owns_project(project_id)) with check (public.owns_project(project_id));

create policy "diccionario de proyectos propios" on public.domain_terms for all to authenticated
  using (public.owns_project(project_id)) with check (public.owns_project(project_id));

-- Guardar version: congela el borrador y abre el siguiente (atomico, respeta RLS)
create function public.save_version(pid uuid, p_note text)
returns int language plpgsql security invoker set search_path = '' as $$
declare d public.requirement_sets; nid uuid;
begin
  select * into d from public.requirement_sets where project_id = pid and is_draft for update;
  if not found then raise exception 'Sin borrador'; end if;
  update public.requirement_sets set is_draft = false, note = p_note where id = d.id;
  insert into public.requirement_sets (project_id, version, raw_text, engine_version, text_hash, summary, is_draft)
  values (pid, d.version + 1, d.raw_text, d.engine_version, d.text_hash, d.summary, true)
  returning id into nid;
  insert into public.finding_decisions (set_id, finding_key, status)
  select nid, finding_key, status from public.finding_decisions where set_id = d.id;
  return d.version;
end; $$;
