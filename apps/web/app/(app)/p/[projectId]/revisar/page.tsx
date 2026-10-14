import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { RevisarView } from './revisar-view';

export default async function RevisarPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from('projects')
    .select('id, name')
    .eq('id', projectId)
    .single();

  if (!project) notFound();

  const { data: draft } = await supabase
    .from('requirement_sets')
    .select('id, version, raw_text, text_hash, summary, engine_version')
    .eq('project_id', projectId)
    .eq('is_draft', true)
    .single();

  const setId = draft?.id;
  let decisions: Record<string, 'aceptado' | 'rechazado'> = {};
  if (setId) {
    const { data } = await supabase
      .from('finding_decisions')
      .select('finding_key, status')
      .eq('set_id', setId);
    if (data) {
      decisions = Object.fromEntries(data.map((d: { finding_key: string; status: string }) => [d.finding_key, d.status as 'aceptado' | 'rechazado']));
    }
  }

  const { data: overrides } = await supabase
    .from('rule_overrides')
    .select('rule_id, enabled')
    .eq('project_id', projectId);

  const { data: terms } = await supabase
    .from('domain_terms')
    .select('term')
    .eq('project_id', projectId);

  const disabledRules = (overrides ?? []).filter((o: { rule_id: string; enabled: boolean }) => !o.enabled).map((o: { rule_id: string; enabled: boolean }) => o.rule_id);
  const domainTerms = (terms ?? []).map((t: { term: string }) => t.term);

  return (
    <RevisarView
      projectId={projectId}
      projectName={project.name}
      setId={setId ?? ''}
      version={draft?.version ?? 1}
      initialText={draft?.raw_text ?? ''}
      initialDecisions={decisions}
      disabledRules={disabledRules}
      domainTerms={domainTerms}
    />
  );
}
