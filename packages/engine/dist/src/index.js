import { extractConstraint } from './constraints.js';
import { parse } from './parse.js';
import { evaluate } from './rules/evaluate.js';
import { segment } from './segment.js';
import { hashText } from './text.js';
export * from './types.js';
export { RULES } from './rules/catalog.js';
export const ENGINE_VERSION = '0.1.0';
export function analyze(text, options = {}) {
    const lines = text.split(/\r?\n/);
    const requirements = parse(segment(text)).map(withConstraint);
    const findings = evaluate(requirements, options.disabledRules ?? [], options.domainTerms ?? []);
    return { engineVersion: ENGINE_VERSION, hash: hashText(text), lines, requirements, findings, cases: [] };
}
function withConstraint(requirement) {
    return { ...requirement, constraint: extractConstraint(requirement.text) };
}
