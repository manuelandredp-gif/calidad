'use client';

import { useMemo, useState } from 'react';
import { useWorkspace } from '@/lib/store';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { TestCase, Constraint } from '@qualireq/engine';

export default function GenerarPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { analysis } = useWorkspace();
  const [filterReqId, setFilterReqId] = useState<string | null>(null);
  const [view, setView] = useState<'tabla' | 'gherkin'>('tabla');

  const cases = useMemo(() => {
    if (!analysis) return [];
    return filterReqId ? analysis.cases.filter((c) => c.reqId === filterReqId) : analysis.cases;
  }, [analysis, filterReqId]);

  const reqsWithCases = useMemo(() => {
    if (!analysis) return [];
    const ids = new Set(analysis.cases.map((c) => c.reqId));
    return analysis.requirements.filter((r) => ids.has(r.id));
  }, [analysis]);

  if (!analysis || analysis.requirements.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center">
        <h1 className="font-display text-2xl font-bold">Generar casos de prueba</h1>
        <p className="text-ink-muted mt-3">Primero analiza tus requisitos en el paso 1.</p>
        <Link href={`/p/${projectId}/revisar`} className="inline-block mt-4 rounded-[var(--radius-md)] bg-accent px-5 py-2 text-on-accent font-semibold text-sm no-underline">
          Ir a revisar
        </Link>
      </div>
    );
  }

  const typeColor: Record<string, string> = {
    valido: 'bg-accent-soft text-accent',
    invalido: 'bg-sev-alta-soft text-sev-alta',
    limite: 'bg-sev-media-soft text-sev-media',
    nf: 'bg-s2 text-ink-muted',
  };

  const typeLabel: Record<string, string> = {
    valido: 'Valido',
    invalido: 'Invalido',
    limite: 'Limite',
    nf: 'No funcional',
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Generar casos de prueba</h1>
        <p className="text-sm text-ink-muted mt-1">{analysis.cases.length} casos generados a partir de {reqsWithCases.length} requisitos con restricciones verificables</p>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-1 text-sm">
        <Link href={`/p/${projectId}/revisar`} className="rounded-[var(--radius-pill)] px-3 py-1 text-ink-muted hover:bg-s2 no-underline">1 Revisar y corregir</Link>
        <span className="rounded-[var(--radius-pill)] bg-accent px-3 py-1 text-on-accent font-semibold">2 Generar casos</span>
        <Link href={`/p/${projectId}/exportar`} className="rounded-[var(--radius-pill)] px-3 py-1 text-ink-muted hover:bg-s2 no-underline">3 Exportar</Link>
      </div>

      {/* Number lines */}
      {reqsWithCases.map((req) => {
        const reqCases = analysis.cases.filter((c) => c.reqId === req.id);
        const constraint = req.constraint;
        if (!constraint) return null;

        return (
          <div key={req.id} className="rounded-[var(--radius-lg)] border border-line bg-s1 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs text-ink-muted">{req.id}</span>
              <span className="text-sm text-ink truncate">{req.text.slice(0, 80)}{req.text.length > 80 ? '...' : ''}</span>
            </div>
            <div className="text-xs text-ink-muted mb-3">
              Restriccion: {constraint.raw} · {reqCases.length} casos
            </div>
            <NumberLine constraint={constraint} cases={reqCases} />
          </div>
        );
      })}

      {/* Filter + view toggle */}
      <div className="flex items-center gap-3">
        <select
          value={filterReqId ?? ''}
          onChange={(e) => setFilterReqId(e.target.value || null)}
          className="h-[34px] rounded-[var(--radius-md)] border border-line bg-s1 px-3 text-sm text-ink"
        >
          <option value="">Todos los requisitos</option>
          {reqsWithCases.map((r) => (
            <option key={r.id} value={r.id}>{r.id}</option>
          ))}
        </select>
        <div className="flex rounded-[var(--radius-md)] border border-line overflow-hidden">
          <button
            onClick={() => setView('tabla')}
            className={`px-3 py-1.5 text-xs ${view === 'tabla' ? 'bg-accent text-on-accent' : 'bg-s1 text-ink hover:bg-s2'}`}
          >
            Tabla
          </button>
          <button
            onClick={() => setView('gherkin')}
            className={`px-3 py-1.5 text-xs ${view === 'gherkin' ? 'bg-accent text-on-accent' : 'bg-s1 text-ink hover:bg-s2'}`}
          >
            Gherkin
          </button>
        </div>
      </div>

      {view === 'tabla' ? (
        <div className="rounded-[var(--radius-lg)] border border-line bg-s1 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-s2">
                <th className="text-left px-4 py-2 font-mono text-xs text-ink-muted">ID</th>
                <th className="text-left px-4 py-2 text-xs text-ink-muted">Req</th>
                <th className="text-left px-4 py-2 text-xs text-ink-muted">Tipo</th>
                <th className="text-left px-4 py-2 text-xs text-ink-muted">Tecnica</th>
                <th className="text-left px-4 py-2 text-xs text-ink-muted">Dato</th>
                <th className="text-left px-4 py-2 text-xs text-ink-muted">Resultado esperado</th>
                <th className="text-left px-4 py-2 text-xs text-ink-muted">Prioridad</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((tc) => (
                <tr key={tc.id} className="border-b border-line last:border-0 hover:bg-s2/50">
                  <td className="px-4 py-2 font-mono text-xs">{tc.id}</td>
                  <td className="px-4 py-2 font-mono text-xs text-ink-muted">{tc.reqId}</td>
                  <td className="px-4 py-2">
                    <span className={`rounded-[var(--radius-pill)] px-2 py-0.5 text-xs ${typeColor[tc.type]}`}>
                      {typeLabel[tc.type]}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-xs text-ink-muted">{tc.technique}</td>
                  <td className="px-4 py-2 text-xs">{tc.data}</td>
                  <td className="px-4 py-2 text-xs">{tc.expected}</td>
                  <td className="px-4 py-2 text-xs text-ink-muted">{tc.priority}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-[var(--radius-lg)] border border-line bg-s1 p-4">
          <pre className="font-mono text-sm text-ink whitespace-pre-wrap">
            {cases.map((tc) => [
              `Feature: ${tc.reqId}`,
              `  Scenario: ${tc.id} - ${tc.technique} (${typeLabel[tc.type]})`,
              `    Given el sistema esta operativo`,
              `    When se aplica el dato "${tc.data}"`,
              `    Then ${tc.expected}`,
              '',
            ].join('\n')).join('\n')}
          </pre>
        </div>
      )}

      <div className="flex justify-between">
        <Link
          href={`/p/${projectId}/revisar`}
          className="h-[42px] flex items-center rounded-[var(--radius-md)] border border-line px-5 text-ink font-semibold text-sm no-underline hover:bg-s2"
        >
          Anterior: revisar
        </Link>
        <Link
          href={`/p/${projectId}/exportar`}
          className="h-[42px] flex items-center rounded-[var(--radius-md)] bg-accent px-5 text-on-accent font-semibold text-sm no-underline"
        >
          Siguiente: exportar
        </Link>
      </div>
    </div>
  );
}

function NumberLine({ constraint, cases }: { constraint: Constraint; cases: TestCase[] }) {
  const points = cases.map((c) => c.value).filter((v) => Number.isFinite(v));
  if (points.length === 0) return null;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const pad = range * 0.15;
  const lo = min - pad;
  const hi = max + pad;
  const total = hi - lo;

  const pct = (v: number) => ((v - lo) / total) * 100;

  return (
    <div className="relative h-12 mx-4">
      <div className="absolute top-5 left-0 right-0 h-0.5 bg-line" />
      {cases.map((tc) => {
        if (!Number.isFinite(tc.value)) return null;
        const left = pct(tc.value);
        const color = tc.type === 'valido' ? 'bg-accent' : tc.type === 'invalido' ? 'bg-sev-alta' : 'bg-sev-media';
        return (
          <div
            key={tc.id}
            className="absolute flex flex-col items-center"
            style={{ left: `${left}%`, transform: 'translateX(-50%)' }}
            title={`${tc.id}: ${tc.data} → ${tc.expected}`}
          >
            <span className="text-[10px] text-ink-muted font-mono whitespace-nowrap">{tc.data}</span>
            <span className={`h-2.5 w-2.5 rounded-full ${color} border-2 border-s1`} />
          </div>
        );
      })}
    </div>
  );
}
