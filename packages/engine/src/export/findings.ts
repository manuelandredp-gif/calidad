import type { Analysis, Finding } from '../types.js';

export function findingsCsv(open: Finding[]): string {
  const header = 'requisito,regla,atributo,severidad,titulo,terminos';
  const rows = open.map((f) =>
    [f.reqId, f.ruleId, f.attribute, f.severity, f.title, f.terms.join('; ')].map(csvEscape).join(',')
  );
  return [header, ...rows].join('\n');
}

export function findingsMd(open: Finding[]): string {
  const header = [
    '# Sospechas',
    '',
    '| Requisito | Regla | Atributo | Severidad | Título | Términos |',
    '|---|---|---|---|---|---|',
  ];
  const rows = open.map((f) =>
    `| ${f.reqId} | ${f.ruleId} | ${f.attribute} | ${f.severity} | ${f.title} | ${f.terms.join(', ')} |`
  );
  return [...header, ...rows].join('\n');
}

export function findingsJson(open: Finding[], a: Analysis): string {
  return JSON.stringify({
    engine_version: a.engineVersion,
    huella: a.hash,
    sospechas: open.map((f) => ({
      requisito: f.reqId,
      regla: f.ruleId,
      atributo: f.attribute,
      severidad: f.severity,
      titulo: f.title,
      por_que: f.why,
      terminos: f.terms,
    })),
  }, null, 2);
}

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
