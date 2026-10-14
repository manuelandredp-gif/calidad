import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { ReglasView } from './reglas-view';

export default async function ReglasPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from('projects')
    .select('id, name')
    .eq('id', projectId)
    .single();

  if (!project) notFound();

  const { data: overrides } = await supabase
    .from('rule_overrides')
    .select('rule_id, enabled')
    .eq('project_id', projectId);

  const { data: terms } = await supabase
    .from('domain_terms')
    .select('id, term')
    .eq('project_id', projectId);

  const ruleOverrides: Record<string, boolean> = {};
  for (const o of overrides ?? []) ruleOverrides[o.rule_id] = o.enabled;

  return (
    <ReglasView
      projectId={projectId}
      projectName={project.name}
      ruleOverrides={ruleOverrides}
      domainTerms={terms ?? []}
    />
  );
}
