import type { Analysis } from '../types.js';

export function casesCsv(a: Analysis): string {
  const header = 'id,requisito,tipo,tecnica,datos,resultado_esperado,prioridad';
  const rows = a.cases.map((c) =>
    [c.id, c.reqId, c.type, c.technique, c.data, c.expected, c.priority].map(csvEscape).join(',')
  );
  return [header, ...rows].join('\n');
}

export function casesMd(a: Analysis): string {
  const header = [
    '# Casos de prueba',
    '',
    '| ID | Requisito | Tipo | Técnica | Datos | Resultado esperado | Prioridad |',
    '|---|---|---|---|---|---|---|',
  ];
  const rows = a.cases.map((c) =>
    `| ${c.id} | ${c.reqId} | ${c.type} | ${c.technique} | ${c.data} | ${c.expected} | ${c.priority} |`
  );
  return [...header, ...rows].join('\n');
}

export function casesJson(a: Analysis): string {
  return JSON.stringify({
    engine_version: a.engineVersion,
    huella: a.hash,
    casos: a.cases.map((c) => ({
      id: c.id,
      requisito: c.reqId,
      tipo: c.type,
      tecnica: c.technique,
      datos: c.data,
      resultado_esperado: c.expected,
      prioridad: c.priority,
    })),
  }, null, 2);
}

export function casesGherkin(a: Analysis): string {
  const features = a.cases.map((c) => [
    `Feature: ${c.reqId}`,
    '',
    `  Scenario: ${c.id} — ${c.technique}`,
    `    Given el sistema bajo prueba`,
    `    When se ingresa ${c.data}`,
    `    Then ${c.expected}`,
    '',
  ].join('\n'));
  return features.join('\n');
}

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
