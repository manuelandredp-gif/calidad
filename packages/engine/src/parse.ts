import { extractConstraint } from './constraints.js';
import type { Kind, Priority, Requirement } from './types.js';
import type { Line } from './segment.js';

const ID = /^((?:RNF|RF|R)-?\d+)\s*[:.\-–]?\s*/i;
const PRIORITY = /\s*Prioridad:\s*(Alta|Media|Baja)\.?\s*$/i;

export function parse(lines: Line[]): Requirement[] {
  return lines.map((line, index) => parseLine(line, index));
}

function parseLine(line: Line, index: number): Requirement {
  const idMatch = line.text.match(ID);
  const hasId = Boolean(idMatch);
  const id = idMatch?.[1]?.toUpperCase() ?? `R-${String(index + 1).padStart(2, '0')}`;
  const withoutId = line.text.slice(idMatch?.[0].length ?? 0);
  const { text, priority } = parsePriority(withoutId);
  return { id, hasId, line: line.line, kind: kindFor(id), priority, text, constraint: extractConstraint(text) };
}

function parsePriority(text: string): { text: string; priority: Priority | null } {
  const match = text.match(PRIORITY);
  return { text: text.slice(0, match?.index).trim(), priority: match?.[1] ? capitalize(match[1]) : null };
}

function capitalize(value: string): Priority {
  return `${value[0]?.toUpperCase()}${value.slice(1).toLowerCase()}` as Priority;
}

function kindFor(id: string): Kind {
  return id.startsWith('RNF') ? 'RNF' : 'RF';
}
