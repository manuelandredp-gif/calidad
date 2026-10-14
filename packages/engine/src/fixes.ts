import type { Requirement } from './types.js';

const SUBJECTS = ['el sistema', 'la aplicación', 'el módulo', 'la plataforma', 'el servidor', 'la app'];

const AMB01_CLAUSES: Record<string, string> = {
  'rápido': 'responder en menos de ‹2 s›',
  'rápida': 'responder en menos de ‹2 s›',
  'fácil': 'permitir completar ‹la tarea› en no más de ‹3› pasos',
  'amigable': 'permitir que el ‹90 %› de los usuarios nuevos complete ‹la tarea› sin ayuda',
  'intuitivo': 'permitir que el ‹90 %› de los usuarios nuevos complete ‹la tarea› sin ayuda',
  'sencillo': 'permitir que el ‹90 %› de los usuarios nuevos complete ‹la tarea› sin ayuda',
  'eficiente': 'consumir menos de ‹n› ‹recurso› por operación',
  'robusto': 'operar ‹720› horas continuas sin fallas',
  'adecuado': 'cumplir ‹criterio medible con unidad›',
  'adecuada': 'cumplir ‹criterio medible con unidad›',
  'óptimo': 'cumplir ‹criterio medible con unidad›',
  'moderno': 'seguir la ‹guía de estilo vigente›',
};

const VIA01_MAP: Record<string, string> = {
  'siempre': 'en el ‹99,5 %› de los casos',
  'nunca': 'en menos del ‹0,5 %› de los casos',
  'todos': '‹cada uno de›',
  'todas': '‹cada una de›',
  '100 %': '‹99,5 %›',
  '100%': '‹99,5 %›',
  'totalmente': 'en un ‹95 %›',
  'ningún': '‹menos del 0,5 % de›',
};

const VER02_TERMS = ['varios', 'varias', 'algunos', 'algunas', 'muchos', 'muchas', 'pocos', 'pocas', 'diversos'];

const IMPROVE_ORDER = ['AMB-02', 'AMB-03', 'AMB-01', 'COM-02', 'VER-02', 'VER-01', 'VIA-01', 'COM-01', 'COM-03', 'COR-01', 'PRI-01', 'CON-01'];

export function suggestFix(ruleId: string, req: Requirement, all: Requirement[]): string {
  const line = buildLine(req);
  const fixed = applyFix(ruleId, req, line, all);
  return fixed;
}

export function improve(req: Requirement, ruleIds: string[], all: Requirement[]): string {
  const sorted = IMPROVE_ORDER.filter((id) => ruleIds.includes(id));
  let current = { ...req, text: req.text };
  let result = buildLine(current);
  for (const ruleId of sorted) {
    const fixed = applyFix(ruleId, current, result, all);
    const lines = fixed.split('\n');
    result = lines[0] ?? result;
    current = { ...current, text: extractText(result, current) };
    if (lines.length > 1) {
      result = lines.join('\n');
    }
  }
  return result;
}

export function applyReplacements(text: string, items: { req: Requirement; replacement: string }[]): string {
  const lines = text.split(/\r?\n/);
  const sorted = [...items].sort((a, b) => b.req.line - a.req.line);
  for (const item of sorted) {
    const replacementLines = item.replacement.split('\n');
    if (replacementLines[0] && !startsWithId(replacementLines[0]) && item.req.hasId) {
      replacementLines[0] = `${item.req.id} ${replacementLines[0]}`;
    }
    lines.splice(item.req.line, 1, ...replacementLines);
  }
  return lines.join('\n');
}

function startsWithId(line: string): boolean {
  return /^(?:RNF|RF|R)-?\d+/i.test(line.trim());
}

function buildLine(req: Requirement): string {
  const parts: string[] = [];
  if (req.hasId) parts.push(req.id);
  parts.push(req.text);
  if (req.priority) parts.push(`Prioridad: ${req.priority}`);
  return parts.join(' ');
}

function extractText(line: string, req: Requirement): string {
  let result = line;
  if (req.hasId) {
    result = result.replace(/^(?:RNF|RF|R)-?\d+\s*/i, '');
  }
  result = result.replace(/\s*Prioridad:\s*(?:Alta|Media|Baja)\.?\s*$/i, '').trim();
  return result;
}

function applyFix(ruleId: string, req: Requirement, line: string, all: Requirement[]): string {
  switch (ruleId) {
    case 'AMB-01': return fixAmb01(req, line);
    case 'AMB-02': return fixAmb02(line);
    case 'AMB-03': return fixAmb03(req, line);
    case 'VER-01': return fixVer01(req, line);
    case 'VER-02': return fixVer02(line);
    case 'COM-01': return fixCom01(line);
    case 'COM-02': return fixCom02(req, line);
    case 'COM-03': return fixCom03(line);
    case 'COM-04': return line;
    case 'COR-01': return fixCor01(req, line, all);
    case 'VIA-01': return fixVia01(line);
    case 'PRI-01': return fixPri01(line);
    case 'CON-01': return fixCon01(req, line, all);
    default: return line;
  }
}

function fixAmb01(req: Requirement, line: string): string {
  const text = req.text.toLowerCase();
  const debeSerMatch = text.match(/debe\s+(ser|estar)\s+/);
  if (debeSerMatch) {
    const clauses = findAmb01Terms(text).map((t) => AMB01_CLAUSES[t]).filter(Boolean);
    if (clauses.length === 0) return line;
    const subject = findSubject(text);
    return rebuildLine(req, `${subject} debe ${clauses.join(' y ')}`);
  }
  let result = line;
  for (const term of findAmb01Terms(text)) {
    const clause = AMB01_CLAUSES[term];
    if (clause) {
      result = replaceTermIgnoreCase(result, term, `‹${clause}›`);
    }
  }
  return result;
}

function findAmb01Terms(text: string): string[] {
  return Object.keys(AMB01_CLAUSES).filter((t) => wordExists(text, t));
}

function fixAmb02(line: string): string {
  let result = line;
  result = replaceTermIgnoreCase(result, 'y/o', 'y');
  for (const term of ['etc.', 'según corresponda', 'si es posible', 'entre otros', 'cuando sea necesario']) {
    result = removeSubstring(result, term);
  }
  return cleanPunctuation(result);
}

function fixAmb03(req: Requirement, line: string): string {
  const text = req.text;
  const match = text.match(/^((?:los?|las?|el|un|una)\s+)?(.+?)\s+(será|serán|es|son|fue|fueron|sea|sean)\s+(.+)$/i);
  if (!match) return line;
  const article = match[1]?.trim() ?? '';
  const subject = match[2]?.trim() ?? '';
  const participlesPart = match[4]?.trim() ?? '';
  const infinitives = participlesPart.split(/\s+y\s+/).map(toInfinitive).filter(Boolean);
  if (infinitives.length === 0) return line;
  const rest = extractRest(participlesPart);
  const articleSubject = article ? `${article} ${subject}` : subject;
  const newText = `El sistema debe ${infinitives.join(' y ')} ${articleSubject}${rest ? ` ${rest}` : ''}`;
  return rebuildLine(req, cleanDot(newText));
}

function toInfinitive(word: string): string {
  const trimmed = word.trim().split(/\s+/)[0] ?? '';
  if (trimmed.match(/ad[oa]s?$/)) return trimmed.replace(/ad[oa]s?$/, 'ar');
  if (trimmed.match(/id[oa]s?$/)) return trimmed.replace(/id[oa]s?$/, 'ir');
  return trimmed;
}

function extractRest(text: string): string {
  const parts = text.split(/\s+/);
  const nonParticiples = parts.filter((p) => !p.match(/^[a-záéíóúñ]+(?:ad[oa]s?|id[oa]s?)$/) && p !== 'y');
  return nonParticiples.join(' ');
}

function fixVer01(req: Requirement, line: string): string {
  const text = req.text.toLowerCase();
  const terms = findAmb01Terms(text);
  if (terms.length > 0) return fixAmb01(req, line);
  return appendToLine(line, ' con ‹criterio medible y unidad›');
}

function fixVer02(line: string): string {
  let result = line;
  for (const term of VER02_TERMS) {
    result = replaceTermIgnoreCase(result, term, '‹100›');
  }
  return result;
}

function fixCom01(line: string): string {
  const lower = line.toLowerCase();
  const debeIdx = lower.indexOf('debe');
  if (debeIdx > 0) {
    const before = line.slice(0, debeIdx).trim();
    if (!hasSubject(before.toLowerCase())) {
      return `El sistema debe ${line.slice(debeIdx + 4).trim()}`;
    }
    return line;
  }
  return `El sistema debe ${lowerFirst(line)}`;
}

function fixCom02(req: Requirement, line: string): string {
  const text = req.text.toLowerCase();
  const terms = findAmb01Terms(text);
  if (terms.length > 0) return fixAmb01(req, line);
  return line.replace(
    /debe\s+(ser|estar)\s+([a-záéíóúñ]+)/i,
    'debe ‹acción observable› y mostrar ‹resultado verificable›'
  );
}

function fixCom03(line: string): string {
  return appendToLine(line, ' y rechazar cualquier otro valor mostrando un mensaje de error.');
}

function fixCor01(req: Requirement, line: string, all: Requirement[]): string {
  const text = req.text;
  const verbMatch = text.match(/debe\s+([a-záéíóúñ]+r)\s+y\s+([a-záéíóúñ]+r)\b(.*)/i);
  if (verbMatch) {
    const verb1 = verbMatch[1] ?? '';
    const verb2 = verbMatch[2] ?? '';
    const complement = (verbMatch[3] ?? '').trim();
    const objectMatch = text.match(new RegExp(`debe\\s+${verb1}\\s+(.*?)\\s+y\\s+${verb2}`, 'i'));
    const object1 = objectMatch?.[1]?.trim() ?? '';
    const line1Text = `${findSubjectInText(text)} debe ${verb1} ${object1}.`.replace(/\s+/g, ' ').trim();
    const nextId = nextFreeId(req, all);
    const line2Text = `${nextId} ${findSubjectInText(text)} debe ${verb2} ${complement}`.replace(/\s+/g, ' ').trim();
    const l1 = rebuildLine(req, cleanDot(line1Text));
    return `${l1}\n${cleanDot(line2Text)}`;
  }
  const partMatch = text.match(/(.+?)\s+((?:[a-záéíóúñ]+(?:ad[oa]s?|id[oa]s?))\s+y\s+(?:[a-záéíóúñ]+(?:ad[oa]s?|id[oa]s?)))(.*)/i);
  if (partMatch) {
    const before = partMatch[1]?.trim() ?? '';
    const participles = partMatch[2]?.trim() ?? '';
    const after = partMatch[3]?.trim() ?? '';
    const parts = participles.split(/\s+y\s+/);
    const line1 = rebuildLine(req, cleanDot(`${before} ${parts[0]} ${after}`));
    const nextId = nextFreeId(req, all);
    const line2 = cleanDot(`${nextId} ${before} ${parts[1]} ${after}`);
    return `${line1}\n${line2}`;
  }
  return line;
}

function fixVia01(line: string): string {
  let result = line;
  for (const [term, replacement] of Object.entries(VIA01_MAP)) {
    result = replaceTermIgnoreCase(result, term, replacement);
  }
  return result;
}

function fixPri01(line: string): string {
  if (/Prioridad:\s*(Alta|Media|Baja)/i.test(line)) return line;
  return appendToLine(line, ' Prioridad: Media');
}

function fixCon01(req: Requirement, line: string, all: Requirement[]): string {
  const nextId = nextFreeId(req, all);
  return line.replace(req.id, nextId);
}

function nextFreeId(req: Requirement, all: Requirement[]): string {
  const prefix = req.kind === 'RNF' ? 'RNF' : 'RF';
  const existing = new Set(all.map((r) => r.id));
  let n = 1;
  while (existing.has(`${prefix}-${String(n).padStart(2, '0')}`)) n++;
  return `${prefix}-${String(n).padStart(2, '0')}`;
}

function findSubject(text: string): string {
  for (const s of SUBJECTS) {
    if (text.includes(s)) return capitalize(s);
  }
  return 'El sistema';
}

function findSubjectInText(text: string): string {
  const lower = text.toLowerCase();
  for (const s of SUBJECTS) {
    if (lower.includes(s)) return capitalize(s);
  }
  return 'El sistema';
}

function hasSubject(text: string): boolean {
  return SUBJECTS.some((s) => text.includes(s));
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function lowerFirst(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

function wordExists(text: string, word: string): boolean {
  const lc = text.toLowerCase();
  const wl = word.toLowerCase();
  const idx = lc.indexOf(wl);
  if (idx < 0) return false;
  const charBefore = lc[idx - 1] ?? '';
  const charAfter = lc[idx + wl.length] ?? '';
  const letter = /[a-z0-9áéíóúñü]/;
  return !letter.test(charBefore) && !letter.test(charAfter);
}

function replaceTermIgnoreCase(text: string, term: string, replacement: string): string {
  const lower = text.toLowerCase();
  const termLower = term.toLowerCase();
  let idx = lower.indexOf(termLower);
  if (idx < 0) return text;
  let result = '';
  let last = 0;
  while (idx >= 0) {
    result += text.slice(last, idx) + replacement;
    last = idx + term.length;
    idx = lower.indexOf(termLower, last);
  }
  result += text.slice(last);
  return result;
}

function removeSubstring(text: string, term: string): string {
  return replaceTermIgnoreCase(text, term, '').replace(/\s{2,}/g, ' ').replace(/,\s*,/g, ',');
}

function cleanPunctuation(text: string): string {
  return text.replace(/\s{2,}/g, ' ').replace(/,\s*\./g, '.').replace(/,\s*$/g, '').trim();
}

function cleanDot(text: string): string {
  const trimmed = text.replace(/\.{2,}/g, '.').replace(/\s+\./g, '.').trim();
  return trimmed.endsWith('.') ? trimmed : `${trimmed}.`;
}

function appendToLine(line: string, suffix: string): string {
  const prioMatch = line.match(/(\s*Prioridad:\s*(?:Alta|Media|Baja))\.?\s*$/i);
  if (prioMatch) {
    const before = line.slice(0, prioMatch.index).replace(/\.\s*$/, '');
    return `${before}${suffix} ${prioMatch[1]?.trim()}`;
  }
  const cleaned = line.replace(/\.\s*$/, '');
  return `${cleaned}${suffix}`;
}

function rebuildLine(req: Requirement, text: string): string {
  const parts: string[] = [];
  if (req.hasId) parts.push(req.id);
  parts.push(text);
  if (req.priority) parts.push(`Prioridad: ${req.priority}`);
  return parts.join(' ');
}
