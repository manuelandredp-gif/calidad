import type { Constraint } from './types.js';

const NUMBER = '(\\d+(?:[.,]\\d+)?)';
const UNIT = '([a-záéíóúñ%]+)?';

export function extractConstraint(text: string): Constraint | null {
  const normalized = text.toLowerCase();
  return range(normalized) ?? threshold(normalized) ?? condition(text, normalized) ?? bound(normalized) ?? load(normalized);
}

function numeric(value: string): number {
  return Number.parseFloat(value.replace(',', '.'));
}

function range(text: string): Constraint | null {
  const match = text.match(new RegExp(`(?:entre|de)\\s+${NUMBER}\\s+(?:y|a)\\s+${NUMBER}\\s*${UNIT}`));
  if (!match || numeric(match[2] ?? '') <= numeric(match[1] ?? '')) return null;
  return { type: 'rango', a: numeric(match[1] ?? ''), b: numeric(match[2] ?? ''), unit: match[3] ?? '', raw: match[0] };
}

function threshold(text: string): Constraint | null {
  const match = text.match(new RegExp(`(en menos de|menos de|como máximo|máximo de|no más de|hasta)\\s+${NUMBER}\\s*(ms|s|segundos|minutos|min)(?![a-z])`));
  if (!match) return null;
  return { type: 'umbral', v: numeric(match[2] ?? ''), unit: match[3] ?? '', strict: match[1]?.includes('menos') ?? false, raw: match[0] };
}

function condition(original: string, text: string): Constraint | null {
  const match = text.match(new RegExp(`si\\s+.+?\\s+(supera|excede|es mayor (?:a|que)|es menor (?:a|que))\\s+(s/\\s*|\\$\\s*)?${NUMBER}`));
  if (!match) return null;
  const consequence = original.match(/,\s*(?:el sistema debe\s+)?([^.]+)/i)?.[1]?.trim() ?? '';
  return { type: 'condicion', v: numeric(match[3] ?? ''), money: Boolean(match[2]), less: match[1]?.includes('menor') ?? false, consequence, raw: match[0] };
}

function bound(text: string): Constraint | null {
  const match = text.match(new RegExp(`(máximo|como mínimo|mínimo|al menos)\\s+(?:de\\s+)?${NUMBER}\\s*${UNIT}`));
  if (!match) return null;
  return { type: match[1]?.includes('máx') ? 'max' : 'min', v: numeric(match[2] ?? ''), unit: match[3] ?? '', raw: match[0] };
}

function load(text: string): Constraint | null {
  const match = text.match(new RegExp(`${NUMBER}\\s+usuarios\\s+concurrentes`));
  return match ? { type: 'carga', v: numeric(match[1] ?? ''), unit: 'usuarios', raw: match[0] } : null;
}
