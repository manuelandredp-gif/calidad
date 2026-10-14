import { extractConstraint } from './constraints.js';
import { parse } from './parse.js';
import { evaluate } from './rules/evaluate.js';
import { segment } from './segment.js';
import { hashText } from './text.js';
import type { Analysis, AnalyzeOptions } from './types.js';

export * from './types.js';
export { RULES } from './rules/catalog.js';

export const ENGINE_VERSION = '0.1.0';

export function analyze(text: string, options: AnalyzeOptions = {}): Analysis {
  const lines = text.split(/\r?\n/);
  const requirements = parse(segment(text)).map(withConstraint);
  const findings = evaluate(requirements, options.disabledRules ?? [], options.domainTerms ?? []);
  return { engineVersion: ENGINE_VERSION, hash: hashText(text), lines, requirements, findings, cases: [] };
}

function withConstraint(requirement: Analysis['requirements'][number]): Analysis['requirements'][number] {
  return { ...requirement, constraint: extractConstraint(requirement.text) };
}
