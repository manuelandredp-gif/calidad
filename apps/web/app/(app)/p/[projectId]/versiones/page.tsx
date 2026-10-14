import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { VersionesView } from './versiones-view';

export default async function VersionesPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from('projects')
    .select('id, name')
    .eq('id', projectId)
    .single();

  if (!project) notFound();

  const { data: versions } = await supabase
    .from('requirement_sets')
    .select('id, version, raw_text, text_hash, summary, engine_version, is_draft, note, created_at')
    .eq('project_id', projectId)
    .order('version', { ascending: false });

  return (
    <VersionesView
      projectId={projectId}
      projectName={project.name}
      versions={versions ?? []}
    />
  );
}
