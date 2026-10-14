import { extractConstraint } from './constraints.js';
import { parse } from './parse.js';
import { evaluate } from './rules/evaluate.js';
import { segment } from './segment.js';
import { hashText } from './text.js';
import { generateCases } from './testgen.js';
import type { Analysis, AnalyzeOptions } from './types.js';

export * from './types.js';
export { RULES } from './rules/catalog.js';
export { globalScore, scoreRequirement } from './score.js';
export { suggestFix, improve, applyReplacements } from './fixes.js';
export { wordDiff } from './diff.js';
export type { DiffToken } from './diff.js';

import { improvedTxt, improvedMd, improvedCsv, improvedJson } from './export/improved.js';
import { casesCsv, casesMd, casesJson, casesGherkin } from './export/cases.js';
import { findingsCsv, findingsMd, findingsJson } from './export/findings.js';

export const ENGINE_VERSION = '0.1.0';

export function analyze(text: string, options: AnalyzeOptions = {}): Analysis {
  const lines = text.split(/\r?\n/);
  const requirements = parse(segment(text)).map(withConstraint);
  const findings = evaluate(requirements, options.disabledRules ?? [], options.domainTerms ?? []);
  return { engineVersion: ENGINE_VERSION, hash: hashText(text), lines, requirements, findings, cases: generateCases(requirements) };
}

function withConstraint(requirement: Analysis['requirements'][number]): Analysis['requirements'][number] {
  return { ...requirement, constraint: extractConstraint(requirement.text) };
}

export const exporters = {
  improvedTxt,
  improvedMd,
  improvedCsv,
  improvedJson,
  casesCsv,
  casesMd,
  casesJson,
  casesGherkin,
  findingsCsv,
  findingsMd,
  findingsJson,
};
