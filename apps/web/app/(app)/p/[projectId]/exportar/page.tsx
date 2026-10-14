'use client';

import { useMemo, useState } from 'react';
import { useWorkspace } from '@/lib/store';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { exporters, globalScore } from '@qualireq/engine';

type ExportGroup = 'mejorados' | 'casos' | 'sospechas';
type ExportFormat = string;

const groups: { key: ExportGroup; label: string; formats: { key: ExportFormat; label: string; ext: string }[] }[] = [
  {
    key: 'mejorados',
    label: 'Requisitos mejorados',
    formats: [
      { key: 'improvedTxt', label: 'TXT', ext: '.txt' },
      { key: 'improvedMd', label: 'Markdown', ext: '.md' },
      { key: 'improvedCsv', label: 'CSV', ext: '.csv' },
      { key: 'improvedJson', label: 'JSON', ext: '.json' },
    ],
  },
  {
    key: 'casos',
    label: 'Casos de prueba',
    formats: [
      { key: 'casesCsv', label: 'CSV', ext: '.csv' },
      { key: 'casesMd', label: 'Markdown', ext: '.md' },
      { key: 'casesJson', label: 'JSON', ext: '.json' },
      { key: 'casesGherkin', label: 'Gherkin', ext: '.feature' },
    ],
  },
  {
    key: 'sospechas',
    label: 'Sospechas',
    formats: [
      { key: 'findingsCsv', label: 'CSV', ext: '.csv' },
      { key: 'findingsMd', label: 'Markdown', ext: '.md' },
      { key: 'findingsJson', label: 'JSON', ext: '.json' },
    ],
  },
];

export default function ExportarPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { analysis, decisions } = useWorkspace();
  const openFindings = useMemo(() => {
    if (!analysis) return [];
    return analysis.findings.filter((f) => decisions[f.key] !== 'rechazado');
  }, [analysis, decisions]);
  const [selectedGroup, setSelectedGroup] = useState<ExportGroup>('mejorados');
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('improvedTxt');
  const [copied, setCopied] = useState(false);

  const preview = useMemo(() => {
    if (!analysis) return '';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fn = (exporters as Record<string, (...args: any[]) => string>)[selectedFormat];
    if (!fn) return '';
    if (selectedFormat.startsWith('improved')) {
      return fn(analysis, openFindings, { project: 'Proyecto', version: 1, withOriginal: true });
    }
    if (selectedFormat.startsWith('cases')) {
      return fn(analysis);
    }
    if (selectedFormat === 'findingsJson') {
      return fn(openFindings, analysis);
    }
    return fn(openFindings);
  }, [analysis, openFindings, selectedFormat]);

  if (!analysis || analysis.requirements.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center">
        <h1 className="font-display text-2xl font-bold">Exportar</h1>
        <p className="text-ink-muted mt-3">Primero analiza tus requisitos.</p>
        <Link href={`/p/${projectId}/revisar`} className="inline-block mt-4 rounded-[var(--radius-md)] bg-accent px-5 py-2 text-on-accent font-semibold text-sm no-underline">
          Ir a revisar
        </Link>
      </div>
    );
  }

  const currentGroup = groups.find((g) => g.key === selectedGroup)!;
  const currentFormat = currentGroup.formats.find((f) => f.key === selectedFormat);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(preview);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!currentFormat) return;
    const blob = new Blob([preview], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `requisitos-${selectedGroup}${currentFormat.ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const score = globalScore(analysis.requirements, openFindings);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Exportar</h1>
        <p className="text-sm text-ink-muted mt-1">{analysis.requirements.length} requisitos · {openFindings.length} sospechas · {analysis.cases.length} casos · {score}% calidad</p>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-1 text-sm">
        <Link href={`/p/${projectId}/revisar`} className="rounded-[var(--radius-pill)] px-3 py-1 text-ink-muted hover:bg-s2 no-underline">1 Revisar y corregir</Link>
        <Link href={`/p/${projectId}/generar`} className="rounded-[var(--radius-pill)] px-3 py-1 text-ink-muted hover:bg-s2 no-underline">2 Generar casos</Link>
        <span className="rounded-[var(--radius-pill)] bg-accent px-3 py-1 text-on-accent font-semibold">3 Exportar</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: format selection */}
        <div className="space-y-4">
          {groups.map((group) => (
            <div key={group.key} className="rounded-[var(--radius-lg)] border border-line bg-s1 p-4">
              <h3 className="font-display text-sm font-bold mb-3">{group.label}</h3>
              <div className="space-y-1">
                {group.formats.map((fmt) => {
                  const active = selectedFormat === fmt.key;
                  return (
                    <button
                      key={fmt.key}
                      onClick={() => { setSelectedGroup(group.key); setSelectedFormat(fmt.key); }}
                      className={`w-full text-left rounded-[var(--radius-md)] px-3 py-2 text-sm transition-colors ${active ? 'bg-accent-soft text-accent font-semibold' : 'hover:bg-s2 text-ink'}`}
                    >
                      {fmt.label} <span className="text-ink-muted text-xs">{fmt.ext}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Right: preview */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="h-[34px] rounded-[var(--radius-md)] border border-line-strong px-4 text-xs text-ink hover:bg-s2"
            >
              {copied ? 'Copiado' : 'Copiar al portapapeles'}
            </button>
            <button
              onClick={handleDownload}
              className="h-[34px] rounded-[var(--radius-md)] bg-accent px-4 text-on-accent text-xs font-semibold"
            >
              Descargar {currentFormat?.ext}
            </button>
          </div>
          <div className="rounded-[var(--radius-lg)] border border-line bg-s1 p-4 max-h-[600px] overflow-auto">
            <pre className="font-mono text-sm text-ink whitespace-pre-wrap">{preview}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
