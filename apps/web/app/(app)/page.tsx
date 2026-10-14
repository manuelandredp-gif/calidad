import { createClient } from '@/lib/supabase/server';
import { HomePage } from './home-page';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile: { full_name: string | null } | null = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();
    profile = data;
  }

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, updated_at')
    .order('updated_at', { ascending: false });

  const projectIds = (projects ?? []).map((p: { id: string }) => p.id);

  let drafts: { project_id: string; version: number; summary: { reqs: number; findings: number; cases: number; score: number; verifPct: number }; updated_at: string }[] = [];
  if (projectIds.length > 0) {
    const { data } = await supabase
      .from('requirement_sets')
      .select('project_id, version, summary, updated_at')
      .in('project_id', projectIds)
      .eq('is_draft', true);
    drafts = (data ?? []) as typeof drafts;
  }

  const enriched = (projects ?? []).map((p: { id: string; name: string; updated_at: string }) => {
    const draft = drafts.find((d) => d.project_id === p.id);
    return {
      id: p.id,
      name: p.name,
      updatedAt: p.updated_at,
      version: draft?.version ?? 1,
      summary: draft?.summary ?? { reqs: 0, findings: 0, cases: 0, score: 0, verifPct: 0 },
    };
  });

  return (
    <HomePage
      userName={profile?.full_name ?? user?.email?.split('@')[0] ?? 'Usuario'}
      projects={enriched}
    />
  );
}
