'use client';

import { useState } from 'react';
import { RULES } from '@qualireq/engine';
import { setRuleEnabled, addDomainTerm, removeDomainTerm } from '../../../actions';
import { useRouter } from 'next/navigation';

interface Props {
  projectId: string;
  projectName: string;
  ruleOverrides: Record<string, boolean>;
  domainTerms: { id: string; term: string }[];
}

export function ReglasView({ projectId, projectName, ruleOverrides, domainTerms }: Props) {
  const router = useRouter();
  const [overrides, setOverrides] = useState(ruleOverrides);
  const [terms, setTerms] = useState(domainTerms);
  const [newTerm, setNewTerm] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const isEnabled = (ruleId: string) => overrides[ruleId] ?? true;
  const activeCount = RULES.filter((r) => isEnabled(r.id)).length;

  const handleToggle = async (ruleId: string) => {
    const enabled = !isEnabled(ruleId);
    setOverrides({ ...overrides, [ruleId]: enabled });
    await setRuleEnabled({ projectId, ruleId, enabled });
    setToast(`${ruleId} ${enabled ? 'activada' : 'desactivada'}. Los cambios se aplican en el proximo analisis.`);
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddTerm = async () => {
    const term = newTerm.trim();
    if (!term) return;
    const result = await addDomainTerm({ projectId, term });
    if (result.ok) {
      setNewTerm('');
      router.refresh();
      setToast(`"${term}" agregado al diccionario de dominio.`);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleRemoveTerm = async (id: string, term: string) => {
    await removeDomainTerm(id);
    setTerms(terms.filter((t) => t.id !== id));
    setToast(`"${term}" eliminado del diccionario.`);
    setTimeout(() => setToast(null), 3000);
  };

  const sevColor: Record<string, string> = {
    alta: 'sev-alta',
    media: 'sev-media',
    baja: 'sev-baja',
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <p className="text-sm text-ink-muted">Proyectos / {projectName}</p>
        <h1 className="font-display text-2xl font-bold tracking-tight mt-1">Reglas y diccionario</h1>
        <p className="text-sm text-ink-muted mt-1">{activeCount} de {RULES.length} reglas activas</p>
      </div>

      {toast && (
        <div className="rounded-[var(--radius-md)] bg-accent-soft border border-accent/20 px-4 py-3 text-sm text-accent">
          {toast}
        </div>
      )}

      {/* Rules */}
      <div className="space-y-2">
        {RULES.map((rule) => {
          const enabled = isEnabled(rule.id);
          return (
            <div key={rule.id} className={`rounded-[var(--radius-md)] border p-4 transition-colors ${enabled ? 'border-line bg-s1' : 'border-line bg-s2 opacity-60'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <button
                    onClick={() => handleToggle(rule.id)}
                    className={`shrink-0 h-5 w-9 rounded-full transition-colors relative ${enabled ? 'bg-accent' : 'bg-s3'}`}
                    role="switch"
                    aria-checked={enabled}
                    aria-label={`${rule.id} ${enabled ? 'activada' : 'desactivada'}`}
                  >
                    <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${enabled ? 'left-[18px]' : 'left-0.5'}`} />
                  </button>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold">{rule.id}</span>
                      <span className={`rounded-[var(--radius-pill)] bg-${sevColor[rule.severity]}-soft text-${sevColor[rule.severity]} px-2 py-0.5 text-xs capitalize`}>{rule.severity}</span>
                      <span className="rounded-[var(--radius-pill)] bg-s2 px-2 py-0.5 text-xs text-ink-muted">{rule.kind}</span>
                      <span className="rounded-[var(--radius-pill)] bg-s2 px-2 py-0.5 text-xs text-ink-muted">{rule.attribute}</span>
                    </div>
                    <p className="text-sm font-semibold mt-1">{rule.title}</p>
                    <p className="text-xs text-ink-muted mt-0.5">{rule.why}</p>
                  </div>
                </div>
              </div>
              {rule.terms.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1 pl-12">
                  {rule.terms.map((t) => (
                    <span key={t} className="rounded-[var(--radius-pill)] bg-s2 px-2 py-0.5 text-xs text-ink-muted font-mono">{t}</span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Domain Terms */}
      <div className="rounded-[var(--radius-lg)] border border-line bg-s1 p-6">
        <h2 className="font-display text-lg font-bold mb-1">Diccionario de dominio</h2>
        <p className="text-sm text-ink-muted mb-4">
          Los terminos agregados aqui no se marcaran como ambiguos, absolutos ni subjetivos en el analisis. Util para vocabulario tecnico del proyecto.
        </p>

        <div className="flex items-center gap-2 mb-4">
          <input
            value={newTerm}
            onChange={(e) => setNewTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTerm()}
            placeholder="Nuevo termino (ej. microservicio)"
            maxLength={60}
            className="flex-1 h-[34px] rounded-[var(--radius-md)] border border-line bg-s1 px-3 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <button
            onClick={handleAddTerm}
            disabled={!newTerm.trim()}
            className="h-[34px] rounded-[var(--radius-md)] bg-accent px-4 text-on-accent text-sm font-semibold disabled:opacity-50"
          >
            Agregar
          </button>
        </div>

        {terms.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {terms.map((t) => (
              <span key={t.id} className="flex items-center gap-1 rounded-[var(--radius-pill)] bg-s2 px-3 py-1 text-sm">
                {t.term}
                <button
                  onClick={() => handleRemoveTerm(t.id, t.term)}
                  className="ml-1 text-ink-muted hover:text-sev-alta text-xs"
                  aria-label={`Eliminar ${t.term}`}
                >
                  x
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-muted">Sin terminos de dominio configurados.</p>
        )}
      </div>
    </div>
  );
}
