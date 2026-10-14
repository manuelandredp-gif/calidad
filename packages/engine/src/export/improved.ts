import { improve } from '../fixes.js';
import type { Analysis, Finding } from '../types.js';

interface ExportOptions {
  withOriginal: boolean;
  project: string;
  version: number;
}

export function improvedTxt(a: Analysis, open: Finding[], opts: ExportOptions): string {
  const header = [
    'QualiReq · Requisitos mejorados',
    `Proyecto: ${opts.project} · versión ${opts.version}`,
    `Motor v${a.engineVersion} · huella ${a.hash} · ${formatDate()}`,
    'Completa los valores entre ‹ › antes de aprobar los requisitos.',
    '',
  ];
  const lines = a.requirements.map((req) => {
    const reqFindings = open.filter((f) => f.reqId === req.id);
    const ruleIds = reqFindings.map((f) => f.ruleId);
    const improved = ruleIds.length > 0 ? improve(req, ruleIds, a.requirements) : buildLine(req);
    const result = [improved];
    if (opts.withOriginal && ruleIds.length > 0) {
      result.push(`    Antes: ${buildLine(req)}`);
    }
    if (ruleIds.length > 0) {
      result.push(`    Reglas corregidas: ${ruleIds.join(', ')}`);
    }
    return result.join('\n');
  });
  return [...header, ...lines].join('\n');
}

export function improvedMd(a: Analysis, open: Finding[], opts: ExportOptions): string {
  const header = [
    '# QualiReq · Requisitos mejorados',
    '',
    `**Proyecto:** ${opts.project} · versión ${opts.version}`,
    `**Motor** v${a.engineVersion} · huella \`${a.hash}\` · ${formatDate()}`,
    '',
    '> Completa los valores entre ‹ › antes de aprobar los requisitos.',
    '',
  ];
  const lines = a.requirements.map((req) => {
    const reqFindings = open.filter((f) => f.reqId === req.id);
    const ruleIds = reqFindings.map((f) => f.ruleId);
    const improved = ruleIds.length > 0 ? improve(req, ruleIds, a.requirements) : buildLine(req);
    const parts = [`- ${improved}`];
    if (opts.withOriginal && ruleIds.length > 0) {
      parts.push(`  - **Antes:** ${buildLine(req)}`);
    }
    if (ruleIds.length > 0) {
      parts.push(`  - Reglas corregidas: ${ruleIds.join(', ')}`);
    }
    return parts.join('\n');
  });
  return [...header, ...lines].join('\n');
}

export function improvedCsv(a: Analysis, open: Finding[], _opts: ExportOptions): string {
  const header = 'id,original,mejorado,reglas_corregidas';
  const rows = a.requirements.map((req) => {
    const reqFindings = open.filter((f) => f.reqId === req.id);
    const ruleIds = reqFindings.map((f) => f.ruleId);
    const improved = ruleIds.length > 0 ? improve(req, ruleIds, a.requirements) : buildLine(req);
    const improvedLines = improved.split('\n').join(' | ');
    return `${csvEscape(req.id)},${csvEscape(buildLine(req))},${csvEscape(improvedLines)},${csvEscape(ruleIds.join(', '))}`;
  });
  return [header, ...rows].join('\n');
}

export function improvedJson(a: Analysis, open: Finding[], _opts: ExportOptions): string {
  const requisitos = a.requirements.map((req) => {
    const reqFindings = open.filter((f) => f.reqId === req.id);
    const ruleIds = reqFindings.map((f) => f.ruleId);
    const improved = ruleIds.length > 0 ? improve(req, ruleIds, a.requirements) : buildLine(req);
    return {
      id: req.id,
      original: buildLine(req),
      mejorado: improved.split('\n'),
      reglas_corregidas: ruleIds,
    };
  });
  return JSON.stringify({ engine_version: a.engineVersion, huella: a.hash, requisitos }, null, 2);
}

function buildLine(req: Analysis['requirements'][number]): string {
  const parts: string[] = [];
  if (req.hasId) parts.push(req.id);
  parts.push(req.text);
  if (req.priority) parts.push(`Prioridad: ${req.priority}`);
  return parts.join(' ');
}

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatDate(): string {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}
