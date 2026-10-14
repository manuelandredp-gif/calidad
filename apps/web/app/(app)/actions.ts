'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { CreateProjectSchema, SaveDraftSchema, SaveVersionSchema, SetDecisionSchema, SetRuleEnabledSchema, DomainTermSchema } from '@/lib/schemas';
import { ENGINE_VERSION } from '@qualireq/engine';

export async function createProject(formData: FormData) {
  const parsed = CreateProjectSchema.safeParse({ name: formData.get('name') });
  if (!parsed.success) return { ok: false as const, error: parsed.error.flatten().fieldErrors.name?.[0] ?? 'Error' };

  const supabase = await createClient();
  const { data: project, error } = await supabase
    .from('projects')
    .insert({ name: parsed.data.name })
    .select('id')
    .single();

  if (error || !project) return { ok: false as const, error: 'No se pudo crear el proyecto.' };

  await supabase
    .from('requirement_sets')
    .insert({ project_id: project.id, version: 1, engine_version: ENGINE_VERSION, is_draft: true });

  await supabase
    .from('profiles')
    .update({ last_project_id: project.id })
    .eq('id', (await supabase.auth.getUser()).data.user!.id);

  redirect(`/p/${project.id}/revisar`);
}

export async function renameProject(id: string, name: string) {
  const supabase = await createClient();
  await supabase.from('projects').update({ name }).eq('id', id);
  revalidatePath('/');
}

export async function deleteProject(id: string) {
  const supabase = await createClient();
  await supabase.from('projects').delete().eq('id', id);
  revalidatePath('/');
}

export async function saveDraft(data: { projectId: string; rawText: string; textHash: string; summary: { reqs: number; findings: number; cases: number; score: number; verifPct: number } }) {
  const parsed = SaveDraftSchema.safeParse(data);
  if (!parsed.success) return { ok: false as const, error: 'Datos invalidos' };

  const supabase = await createClient();
  await supabase
    .from('requirement_sets')
    .update({
      raw_text: parsed.data.rawText,
      text_hash: parsed.data.textHash,
      engine_version: ENGINE_VERSION,
      summary: parsed.data.summary,
    })
    .eq('project_id', parsed.data.projectId)
    .eq('is_draft', true);

  return { ok: true as const };
}

export async function saveVersion(data: { projectId: string; note?: string }) {
  const parsed = SaveVersionSchema.safeParse(data);
  if (!parsed.success) return { ok: false as const, error: 'Datos invalidos' };

  const supabase = await createClient();
  const { data: version, error } = await supabase.rpc('save_version', {
    pid: parsed.data.projectId,
    p_note: parsed.data.note ?? null,
  });

  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`/p/${parsed.data.projectId}/versiones`);
  return { ok: true as const, data: { version } };
}

export async function restoreVersion(projectId: string, version: number) {
  const supabase = await createClient();
  const { data: source } = await supabase
    .from('requirement_sets')
    .select('raw_text')
    .eq('project_id', projectId)
    .eq('version', version)
    .single();

  if (!source) return { ok: false as const, error: 'Version no encontrada' };

  await supabase
    .from('requirement_sets')
    .update({ raw_text: source.raw_text })
    .eq('project_id', projectId)
    .eq('is_draft', true);

  revalidatePath(`/p/${projectId}/revisar`);
  return { ok: true as const };
}

export async function setDecision(data: { setId: string; findingKey: string; status: 'aceptado' | 'rechazado' | null }) {
  const parsed = SetDecisionSchema.safeParse(data);
  if (!parsed.success) return { ok: false as const, error: 'Datos invalidos' };

  const supabase = await createClient();
  if (parsed.data.status === null) {
    await supabase
      .from('finding_decisions')
      .delete()
      .eq('set_id', parsed.data.setId)
      .eq('finding_key', parsed.data.findingKey);
  } else {
    await supabase
      .from('finding_decisions')
      .upsert({
        set_id: parsed.data.setId,
        finding_key: parsed.data.findingKey,
        status: parsed.data.status,
        decided_at: new Date().toISOString(),
      });
  }

  return { ok: true as const };
}

export async function setRuleEnabled(data: { projectId: string; ruleId: string; enabled: boolean }) {
  const parsed = SetRuleEnabledSchema.safeParse(data);
  if (!parsed.success) return { ok: false as const, error: 'Datos invalidos' };

  const supabase = await createClient();
  const { data: rule } = await supabase
    .from('rule_overrides')
    .select('enabled')
    .eq('project_id', parsed.data.projectId)
    .eq('rule_id', parsed.data.ruleId)
    .single();

  if (rule) {
    await supabase
      .from('rule_overrides')
      .delete()
      .eq('project_id', parsed.data.projectId)
      .eq('rule_id', parsed.data.ruleId);
  }

  await supabase.from('rule_overrides').upsert({
    project_id: parsed.data.projectId,
    rule_id: parsed.data.ruleId,
    enabled: parsed.data.enabled,
  });

  return { ok: true as const };
}

export async function addDomainTerm(data: { projectId: string; term: string }) {
  const parsed = DomainTermSchema.safeParse(data);
  if (!parsed.success) return { ok: false as const, error: 'Datos invalidos' };

  const supabase = await createClient();
  const { error } = await supabase.from('domain_terms').insert({
    project_id: parsed.data.projectId,
    term: parsed.data.term,
  });

  if (error) return { ok: false as const, error: 'Termino ya existe o error' };
  return { ok: true as const };
}

export async function removeDomainTerm(id: string) {
  const supabase = await createClient();
  await supabase.from('domain_terms').delete().eq('id', id);
  return { ok: true as const };
}

export async function setLastProject(projectId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.from('profiles').update({ last_project_id: projectId }).eq('id', user.id);
  }
}
