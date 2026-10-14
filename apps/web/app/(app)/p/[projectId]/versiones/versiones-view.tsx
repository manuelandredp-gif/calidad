'use client';

import { useState } from 'react';
import { wordDiff, type DiffToken } from '@qualireq/engine';
import { saveVersion, restoreVersion } from '../../../actions';
import { useRouter } from 'next/navigation';

interface Version {
  id: string;
  version: number;
  raw_text: string | null;
  text_hash: string | null;
  summary: { reqs: number; findings: number; cases: number; score: number; verifPct: number } | null;
  engine_version: string | null;
  is_draft: boolean;
  note: string | null;
  created_at: string;
}

interface Props {
  projectId: string;
  projectName: string;
  versions: Version[];
}

export function VersionesView({ projectId, projectName, versions }: Props) {
  const router = useRouter();
  const [compareA, setCompareA] = useState<number | null>(null);
  const [compareB, setCompareB] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const draft = versions.find((v) => v.is_draft);
  const saved = versions.filter((v) => !v.is_draft);

  const handleSaveVersion = async () => {
    setSaving(true);
    const result = await saveVersion({ projectId, note: note || undefined });
    setSaving(false);
    if (result.ok) {
      setNote('');
      setToast(`Version ${result.data?.version} guardada.`);
      setTimeout(() => setToast(null), 3000);
      router.refresh();
    }
  };

  const handleRestore = async (version: number) => {
    const result = await restoreVersion(projectId, version);
    if (result.ok) {
      setToast(`Version ${version} restaurada al borrador.`);
      setTimeout(() => setToast(null), 3000);
      router.refresh();
    }
  };

  const versionA = compareA !== null ? versions.find((v) => v.version === compareA) : null;
  const versionB = compareB !== null ? versions.find((v) => v.version === compareB) : null;
  const diff = versionA && versionB && versionA.raw_text && versionB.raw_text
    ? wordDiff(versionA.raw_text, versionB.raw_text)
    : null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <p className="text-sm text-ink-muted">Proyectos / {projectName}</p>
        <h1 className="font-display text-2xl font-bold tracking-tight mt-1">Historial de versiones</h1>
      </div>

      {toast && (
        <div className="rounded-[var(--radius-md)] bg-accent-soft border border-accent/20 px-4 py-3 text-sm text-accent">
          {toast}
        </div>
      )}

      {/* Save version */}
      {draft && draft.raw_text && (
        <div className="rounded-[var(--radius-lg)] border border-line bg-s1 p-4">
          <h3 className="font-display text-sm font-bold mb-2">Guardar version actual</h3>
          <p className="text-xs text-ink-muted mb-3">Congela el borrador como version {draft.version} y abre uno nuevo.</p>
          <div className="flex items-center gap-2">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nota opcional (max 280 caracteres)"
              maxLength={280}
              className="flex-1 h-[34px] rounded-[var(--radius-md)] border border-line bg-s1 px-3 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <button
              onClick={handleSaveVersion}
              disabled={saving}
              className="h-[34px] rounded-[var(--radius-md)] bg-accent px-4 text-on-accent text-sm font-semibold disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar version'}
            </button>
          </div>
        </div>
      )}

      {/* Version list */}
      <div className="space-y-2">
        {versions.map((v) => (
          <div
            key={v.id}
            className={`rounded-[var(--radius-md)] border p-4 ${v.is_draft ? 'border-accent bg-accent-soft' : 'border-line bg-s1'}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-bold">v{v.version}</span>
                {v.is_draft && <span className="rounded-[var(--radius-pill)] bg-accent text-on-accent px-2 py-0.5 text-xs">Borrador</span>}
                {v.note && <span className="text-sm text-ink-muted">{v.note}</span>}
              </div>
              <div className="flex items-center gap-2 text-xs text-ink-muted">
                {v.summary && (
                  <>
                    <span>{v.summary.reqs} req</span>
                    <span>{v.summary.score}%</span>
                  </>
                )}
                <span>{new Date(v.created_at).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
            {!v.is_draft && (
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => handleRestore(v.version)}
                  className="h-[30px] rounded-[var(--radius-md)] border border-line-strong px-3 text-xs text-ink hover:bg-s2"
                >
                  Restaurar al borrador
                </button>
                <button
                  onClick={() => setCompareA(v.version)}
                  className={`h-[30px] rounded-[var(--radius-md)] border px-3 text-xs ${compareA === v.version ? 'border-accent bg-accent-soft text-accent' : 'border-line-strong text-ink hover:bg-s2'}`}
                >
                  Comparar A
                </button>
                <button
                  onClick={() => setCompareB(v.version)}
                  className={`h-[30px] rounded-[var(--radius-md)] border px-3 text-xs ${compareB === v.version ? 'border-accent bg-accent-soft text-accent' : 'border-line-strong text-ink hover:bg-s2'}`}
                >
                  Comparar B
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Diff view */}
      {diff && versionA && versionB && (
        <div className="rounded-[var(--radius-lg)] border border-line bg-s1 p-4">
          <h3 className="font-display text-sm font-bold mb-3">Comparacion: v{compareA} vs v{compareB}</h3>
          <div className="font-mono text-sm leading-relaxed">
            {diff.map((token, i) => (
              <span
                key={i}
                className={
                  token.op === 'del' ? 'bg-sev-alta-soft text-sev-alta line-through' :
                  token.op === 'ins' ? 'bg-accent-soft text-accent' :
                  'text-ink'
                }
              >
                {token.t}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
