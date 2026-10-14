'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { analyze, globalScore, scoreRequirement, suggestFix, improve, applyReplacements, type Analysis, type Finding, type Requirement, RULES } from '@qualireq/engine';
import { useWorkspace } from '@/lib/store';
import { saveDraft, setDecision as setDecisionAction } from '../../../actions';
import { QualityRing } from '@/components/ui/quality-ring';
import Link from 'next/link';

const SAMPLE = [
  'RF-01 El sistema debe permitir al usuario ingresar una contrasena de entre 8 y 16 caracteres.',
  'RNF-01 El sistema debe ser rapido y facil de usar.',
  'RF-02 Cuando el usuario confirme el pedido, el sistema debe enviar un correo de confirmacion en menos de 30 s. Prioridad: Alta',
  'RNF-02 El sistema debe soportar varios usuarios concurrentes.',
  'RF-03 Los reportes seran generados y exportados a PDF y/o Excel, etc.',
  'RF-04 Si el monto de la compra supera S/ 500, el sistema debe aplicar un descuento del 10 %. Prioridad: Media',
].join('\n');

interface Props {
  projectId: string;
  projectName: string;
  setId: string;
  version: number;
  initialText: string;
  initialDecisions: Record<string, 'aceptado' | 'rechazado'>;
  disabledRules: string[];
  domainTerms: string[];
}

export function RevisarView({ projectId, projectName, setId, version, initialText, initialDecisions, disabledRules, domainTerms }: Props) {
  const store = useWorkspace();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [analysisTime, setAnalysisTime] = useState(0);

  useEffect(() => {
    store.setText(initialText);
    store.setDecisions(initialDecisions);
    if (initialText) {
      const start = performance.now();
      const result = analyze(initialText, { disabledRules, domainTerms });
      setAnalysisTime(Math.round(performance.now() - start));
      store.setAnalysis(initialText, result);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const doAnalyze = useCallback(() => {
    const start = performance.now();
    const result = analyze(store.text, { disabledRules, domainTerms });
    setAnalysisTime(Math.round(performance.now() - start));
    store.setAnalysis(store.text, result);
    const open = result.findings.filter((f) => store.decisions[f.key] !== 'rechazado');
    const score = globalScore(result.requirements, open);
    const verifPct = result.requirements.length > 0
      ? Math.round(result.requirements.filter((r) => r.constraint).length / result.requirements.length * 100)
      : 0;
    store.setSaving(true);
    saveDraft({
      projectId,
      rawText: store.text,
      textHash: result.hash,
      summary: { reqs: result.requirements.length, findings: open.length, cases: result.cases.length, score, verifPct },
    }).finally(() => store.setSaving(false));
  }, [store.text, disabledRules, domainTerms, projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTextChange = (value: string) => {
    store.setText(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      store.setSaving(true);
      const result = analyze(value, { disabledRules, domainTerms });
      store.setAnalysis(value, result);
      const open = result.findings.filter((f) => store.decisions[f.key] !== 'rechazado');
      const score = globalScore(result.requirements, open);
      const verifPct = result.requirements.length > 0
        ? Math.round(result.requirements.filter((r) => r.constraint).length / result.requirements.length * 100)
        : 0;
      saveDraft({
        projectId,
        rawText: value,
        textHash: result.hash,
        summary: { reqs: result.requirements.length, findings: open.length, cases: result.cases.length, score, verifPct },
      }).finally(() => store.setSaving(false));
    }, 1500);
  };

  const handleLoadSample = () => {
    handleTextChange(SAMPLE);
  };

  const handleClear = () => {
    handleTextChange('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.name.endsWith('.txt')) return;
    const text = await file.text();
    handleTextChange(text);
  };

  const analysis = store.analysis;
  const openFindings = store.openFindings();
  const hasChanges = store.text !== store.analyzedText;
  const score = analysis ? globalScore(analysis.requirements, openFindings) : 0;

  const severityCounts = useMemo(() => {
    const counts = { alta: 0, media: 0, baja: 0 };
    for (const f of openFindings) counts[f.severity]++;
    return counts;
  }, [openFindings]);

  const selectedReq = analysis?.requirements.find((r) => r.id === store.selectedReqId);

  const handleDecision = (key: string, status: 'aceptado' | 'rechazado' | null) => {
    store.setDecision(key, status);
    setDecisionAction({ setId, findingKey: key, status });
  };

  const handleApplyFix = (finding: Finding, fixedText?: string) => {
    if (!analysis) return;
    const req = analysis.requirements.find((r) => r.id === finding.reqId);
    if (!req) return;
    const replacement = fixedText ?? suggestFix(finding.ruleId, req, analysis.requirements);
    const newText = applyReplacements(store.text, [{ req, replacement }]);
    handleTextChange(newText);
    store.setToast({ message: `Correccion ${finding.ruleId} aplicada a ${finding.reqId}. Se volvio a analizar.` });
    setTimeout(() => store.setToast(null), 4000);
  };

  const handleApplyAll = () => {
    if (!analysis) return;
    const items = openFindings.map((f) => {
      const req = analysis.requirements.find((r) => r.id === f.reqId);
      if (!req) return null;
      const replacement = improve(req, openFindings.filter((of) => of.reqId === f.reqId).map((of) => of.ruleId), analysis.requirements);
      return { req, replacement };
    }).filter(Boolean) as { req: Requirement; replacement: string }[];
    const unique = items.filter((item, i, arr) => arr.findIndex((a) => a.req.id === item.req.id) === i);
    const newText = applyReplacements(store.text, unique);
    handleTextChange(newText);
    store.setToast({ message: `Todas las correcciones aplicadas. Se volvio a analizar.` });
    setTimeout(() => store.setToast(null), 4000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-ink-muted">Proyectos / {projectName}</p>
          <h1 className="font-display text-2xl font-bold tracking-tight mt-1">{projectName}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="font-mono text-xs text-ink-muted">Version {version} · borrador</span>
            {analysis && <span className="font-mono text-xs text-ink-muted">Huella: {analysis.hash}</span>}
            {store.saving && <span className="text-xs text-ink-muted">Guardando...</span>}
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-1 text-sm">
        <span className="rounded-[var(--radius-pill)] bg-accent px-3 py-1 text-on-accent font-semibold">1 Revisar y corregir</span>
        <Link href={`/p/${projectId}/generar`} className="rounded-[var(--radius-pill)] px-3 py-1 text-ink-muted hover:bg-s2 no-underline">2 Generar casos</Link>
        <Link href={`/p/${projectId}/exportar`} className="rounded-[var(--radius-pill)] px-3 py-1 text-ink-muted hover:bg-s2 no-underline">3 Exportar</Link>
      </div>

      {/* Toast */}
      {store.toast && (
        <div className="rounded-[var(--radius-md)] bg-accent-soft border border-accent/20 px-4 py-3 text-sm text-accent">
          {store.toast.message}
        </div>
      )}

      {/* Editor */}
      <div className="rounded-[var(--radius-lg)] border-2 border-accent/30 bg-s1 p-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-xs font-semibold text-accent">Paso 1</span>
            <h2 className="font-display text-lg font-bold">Escribe o pega tus requisitos</h2>
            <p className="text-xs text-ink-muted mt-1">Una linea por requisito. Formato: [ID] Texto. Prioridad: Alta|Media|Baja</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3 text-sm">
          <span className="rounded-[var(--radius-pill)] bg-s2 px-3 py-1 text-ink-muted text-xs">[lugar/tiempo/evento]</span>
          <span className="text-ink-muted">+</span>
          <span className="rounded-[var(--radius-pill)] bg-s2 px-3 py-1 text-ink-muted text-xs">debe</span>
          <span className="text-ink-muted">+</span>
          <span className="rounded-[var(--radius-pill)] bg-s2 px-3 py-1 text-ink-muted text-xs">accion</span>
          <span className="text-ink-muted">+</span>
          <span className="rounded-[var(--radius-pill)] bg-s2 px-3 py-1 text-ink-muted text-xs">sujeto</span>
          <span className="text-ink-muted">+</span>
          <span className="rounded-[var(--radius-pill)] bg-s2 px-3 py-1 text-ink-muted text-xs">resultado</span>
        </div>

        <div className="flex gap-2 mb-3">
          <button onClick={handleLoadSample} className="h-[34px] rounded-[var(--radius-md)] border border-line-strong px-3 text-xs text-ink hover:bg-s2">Cargar ejemplo</button>
          <label className="h-[34px] rounded-[var(--radius-md)] border border-line-strong px-3 text-xs text-ink hover:bg-s2 flex items-center cursor-pointer">
            Subir archivo
            <input type="file" accept=".txt" className="hidden" onChange={handleFileUpload} />
          </label>
          <button onClick={handleClear} className="h-[34px] rounded-[var(--radius-md)] border border-line-strong px-3 text-xs text-ink hover:bg-s2">Limpiar</button>
        </div>

        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col items-end pr-2 pt-[14px] pointer-events-none select-none">
            {store.text.split('\n').map((_, i) => {
              const req = analysis?.requirements.find((r) => r.line === i);
              const reqScore = req ? scoreRequirement(req.id, openFindings) : -1;
              const dotColor = hasChanges ? 'bg-s3' : reqScore >= 80 ? 'bg-accent' : reqScore >= 50 ? 'bg-sev-media' : reqScore >= 0 ? 'bg-sev-alta' : 'bg-s3';
              return (
                <div key={i} className="flex items-center gap-1" style={{ height: '28px', lineHeight: '28px' }}>
                  <span className={`h-2 w-2 rounded-full ${dotColor}`} />
                  <span className="font-mono text-xs text-ink-muted w-5 text-right">{i + 1}</span>
                </div>
              );
            })}
          </div>
          <textarea
            value={store.text}
            onChange={(e) => handleTextChange(e.target.value)}
            className="w-full min-h-[200px] rounded-[var(--radius-md)] border border-line bg-s1 pl-14 pr-4 py-3 font-sans text-[15px] leading-[28px] text-ink resize-y focus:outline-none focus:ring-2 focus:ring-accent"
            style={{ whiteSpace: 'pre', overflowWrap: 'normal', overflowX: 'auto' }}
            spellCheck={false}
          />
        </div>

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-4 text-xs text-ink-muted">
            {analysis && <span>Analizado en {analysisTime} ms · mismo texto, mismo resultado</span>}
            {hasChanges && <span className="rounded-[var(--radius-pill)] bg-sev-media-soft text-sev-media px-2 py-0.5">Cambios sin analizar</span>}
          </div>
          <button
            onClick={doAnalyze}
            className="h-[52px] rounded-[var(--radius-md)] bg-accent px-8 text-on-accent font-semibold text-base transition-opacity hover:opacity-90"
          >
            Analizar
          </button>
        </div>
      </div>

      {analysis && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-4 gap-4">
            <div className="rounded-[var(--radius-lg)] border border-line bg-s1 p-4 flex items-center gap-4">
              <QualityRing score={score} size={56} />
              <div>
                <p className="font-display text-2xl font-bold">{score}%</p>
                <p className="text-xs text-ink-muted">Calidad global</p>
              </div>
            </div>
            {(['alta', 'media', 'baja'] as const).map((sev) => (
              <button
                key={sev}
                onClick={() => store.setSeverityFilter(store.severityFilter === sev ? null : sev)}
                className={`rounded-[var(--radius-lg)] border p-4 text-left transition-colors ${store.severityFilter === sev ? `border-sev-${sev} bg-sev-${sev}-soft` : 'border-line bg-s1 hover:bg-s2'}`}
              >
                <p className={`font-display text-2xl font-bold text-sev-${sev}`}>{severityCounts[sev]}</p>
                <p className="text-xs text-ink-muted capitalize">{sev}</p>
              </button>
            ))}
          </div>

          {/* Requirements + Findings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Requirements list */}
            <div className="space-y-4">
              <h3 className="font-display text-lg font-bold">Requisitos ({analysis.requirements.length})</h3>
              <div className="space-y-2">
                {analysis.requirements.map((req) => {
                  const reqScore = scoreRequirement(req.id, openFindings);
                  const reqFindings = openFindings.filter((f) => f.reqId === req.id);
                  const selected = store.selectedReqId === req.id;
                  return (
                    <button
                      key={req.id}
                      onClick={() => store.selectReq(selected ? null : req.id)}
                      className={`w-full text-left rounded-[var(--radius-md)] border p-3 transition-colors ${selected ? 'border-accent bg-accent-soft' : 'border-line hover:bg-s2'}`}
                    >
                      <div className="flex items-center gap-3">
                        <QualityRing score={reqScore} size={32} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-ink-muted">{req.id}</span>
                            <span className="rounded-[var(--radius-pill)] bg-s2 px-2 py-0.5 text-xs text-ink-muted">{req.kind}</span>
                            {reqFindings.length > 0 && (
                              <span className="rounded-[var(--radius-pill)] bg-sev-alta-soft text-sev-alta px-2 py-0.5 text-xs">{reqFindings.length} sosp.</span>
                            )}
                          </div>
                          <p className="text-sm text-ink mt-1 truncate">{req.text}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Findings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-bold">Sospechas ({openFindings.length})</h3>
                {openFindings.length > 0 && (
                  <button onClick={handleApplyAll} className="h-[34px] rounded-[var(--radius-md)] bg-accent px-4 text-on-accent text-sm font-semibold">
                    Aplicar todas las correcciones
                  </button>
                )}
              </div>

              {store.severityFilter && (
                <button
                  onClick={() => store.setSeverityFilter(null)}
                  className={`rounded-[var(--radius-pill)] bg-sev-${store.severityFilter}-soft text-sev-${store.severityFilter} px-3 py-1 text-xs font-medium`}
                >
                  {store.severityFilter} x
                </button>
              )}

              <div className="space-y-3">
                {openFindings
                  .filter((f) => !store.severityFilter || f.severity === store.severityFilter)
                  .filter((f) => !store.selectedReqId || f.reqId === store.selectedReqId)
                  .map((f) => (
                    <FindingCard
                      key={f.key}
                      finding={f}
                      analysis={analysis}
                      onReject={() => handleDecision(f.key, 'rechazado')}
                      onApply={(text) => handleApplyFix(f, text)}
                    />
                  ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Link
              href={`/p/${projectId}/generar`}
              className="h-[42px] flex items-center rounded-[var(--radius-md)] bg-accent px-5 text-on-accent font-semibold text-sm no-underline"
            >
              Siguiente: generar casos
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

function FindingCard({ finding, analysis, onReject, onApply }: { finding: Finding; analysis: Analysis; onReject: () => void; onApply: (text?: string) => void }) {
  const req = analysis.requirements.find((r) => r.id === finding.reqId);
  const [editedFix, setEditedFix] = useState('');
  const [showEdit, setShowEdit] = useState(false);

  const defaultFix = req ? suggestFix(finding.ruleId, req, analysis.requirements) : '';

  const sevColor = finding.severity === 'alta' ? 'sev-alta' : finding.severity === 'media' ? 'sev-media' : 'sev-baja';

  return (
    <div className={`rounded-[var(--radius-md)] border border-line bg-s1 p-4`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={`rounded-[var(--radius-pill)] bg-${sevColor}-soft text-${sevColor} px-2 py-0.5 text-xs font-medium capitalize`}>{finding.severity}</span>
        <span className="font-mono text-xs text-ink-muted">{finding.ruleId}</span>
        <span className="text-xs text-ink-muted">{finding.attribute}</span>
        <button onClick={() => useWorkspace.getState().selectReq(finding.reqId)} className="font-mono text-xs text-accent hover:underline ml-auto">{finding.reqId}</button>
      </div>
      <p className="font-semibold text-sm">{finding.title}</p>
      {finding.terms.length > 0 && (
        <p className="text-sm text-ink-muted mt-1">
          Terminos: {finding.terms.map((t) => `"${t}"`).join(', ')}
        </p>
      )}
      <p className="text-sm text-ink-muted mt-1">{finding.why}</p>

      {finding.ruleId !== 'COM-04' && defaultFix && (
        <div className="mt-3 rounded-[var(--radius-sm)] bg-accent-soft p-3">
          <p className="text-xs text-ink-muted mb-1">Correccion propuesta</p>
          {showEdit ? (
            <textarea
              value={editedFix || defaultFix}
              onChange={(e) => setEditedFix(e.target.value)}
              className="w-full rounded-[var(--radius-sm)] border border-line bg-s1 px-3 py-2 text-sm text-ink resize-none focus:outline-none focus:ring-1 focus:ring-accent"
              rows={2}
            />
          ) : (
            <p className="text-sm text-ink cursor-pointer" onClick={() => setShowEdit(true)}>{defaultFix}</p>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 mt-3">
        {showEdit && editedFix && editedFix !== defaultFix && (
          <button onClick={() => { setEditedFix(''); }} className="h-[34px] rounded-[var(--radius-md)] border border-line-strong px-3 text-xs text-ink">Restablecer</button>
        )}
        <button onClick={onReject} className="h-[34px] rounded-[var(--radius-md)] border border-line-strong px-3 text-xs text-ink hover:bg-s2">Falso positivo</button>
        {defaultFix && (
          <button
            onClick={() => onApply(editedFix || undefined)}
            className="h-[34px] rounded-[var(--radius-md)] bg-accent px-4 text-on-accent text-xs font-semibold ml-auto"
          >
            Aplicar correccion
          </button>
        )}
      </div>
    </div>
  );
}
