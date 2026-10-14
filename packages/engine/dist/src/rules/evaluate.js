import { findWord, maskDomainTerms } from '../text.js';
import { RULES } from './catalog.js';
const SUBJECT = /(el sistema|la aplicación|el módulo|la plataforma|el servidor|la app)/;
const PASSIVE = /(?:^|\s)(será|serán|es|son|fue|fueron|sea|sean)\s+([a-záéíóúñ]+(?:ados?|adas?|idos?|idas?))(?=[\s.,;]|$)/;
const REJECTION = /(rechaz|error|mensaje|impid|bloque|no permit|deneg)/;
const PENDING = /‹[^›]*›/;
const PLACEHOLDER = /(tbd|por definir|pendiente|\?\?)/;
const ATOMIC_PARTICIPLES = /([a-záéíóúñ]+(?:ados?|adas?|idos?|idas?))\s+y\s+([a-záéíóúñ]+(?:ados?|adas?|idos?|idas?))/;
const ATOMIC_VERBS = /\bdebe\s+[a-záéíóúñ]+r\s+y\s+[a-záéíóúñ]+r\b/;
export function evaluate(requirements, disabled, domainTerms) {
    const duplicated = duplicateIds(requirements);
    return requirements.flatMap((requirement) => evaluateRequirement(requirement, duplicated, disabled, domainTerms));
}
function duplicateIds(requirements) {
    const counts = requirements.reduce(countIds, new Map());
    return new Set([...counts].filter(([, count]) => count > 1).map(([id]) => id));
}
function countIds(counts, requirement) {
    counts.set(requirement.id, (counts.get(requirement.id) ?? 0) + 1);
    return counts;
}
function evaluateRequirement(requirement, duplicated, disabled, domainTerms) {
    const original = requirement.text;
    const masked = maskDomainTerms(original, domainTerms);
    const passive = PASSIVE.test(masked);
    return RULES.flatMap((rule) => evaluateRule(rule, requirement, original, masked, passive, duplicated, disabled));
}
function evaluateRule(rule, requirement, original, text, passive, duplicated, disabled) {
    if (disabled.includes(rule.id) || !rule.enabled || !matches(rule.id, requirement, text, passive, duplicated))
        return [];
    return [finding(rule, requirement, termsFor(rule.id, original, text))];
}
function matches(id, requirement, text, passive, duplicated) {
    if (id === 'AMB-01' || id === 'VER-02' || id === 'VIA-01')
        return lexical(id, text);
    if (id === 'AMB-02')
        return ['etc.', 'y/o', 'según corresponda', 'si es posible', 'entre otros', 'cuando sea necesario'].some((term) => text.includes(term));
    if (id === 'AMB-03')
        return passive;
    if (id === 'VER-01')
        return requirement.kind === 'RNF' && !/\d/.test(text);
    if (id === 'COM-01')
        return !passive && !SUBJECT.test(text);
    if (id === 'COM-02')
        return /debe\s+(ser|estar)\s+[a-záéíóúñ]+/.test(text);
    if (id === 'COM-03')
        return hasUnspecifiedRejection(requirement, text);
    if (id === 'COM-04')
        return PENDING.test(requirement.text) || PLACEHOLDER.test(text);
    if (id === 'COR-01')
        return isNonAtomic(text);
    if (id === 'PRI-01')
        return requirement.priority === null;
    if (id === 'CON-01')
        return duplicated.has(requirement.id);
    return false;
}
function lexical(id, text) {
    const terms = RULES.find((rule) => rule.id === id)?.terms ?? [];
    return terms.some((term) => findWord(text, term) >= 0);
}
function hasUnspecifiedRejection(requirement, text) {
    const applicable = requirement.constraint?.type === 'rango' || requirement.constraint?.type === 'max' || requirement.constraint?.type === 'min';
    return Boolean(applicable && !REJECTION.test(text));
}
function isNonAtomic(text) {
    return (text.match(/\bdebe\b/g) ?? []).length > 1 || ATOMIC_PARTICIPLES.test(text) || ATOMIC_VERBS.test(text);
}
function termsFor(id, original, masked) {
    if (id === 'AMB-01' || id === 'VER-02' || id === 'VIA-01')
        return lexicalTerms(id, original, masked);
    if (id === 'AMB-02')
        return ['etc.', 'y/o', 'según corresponda', 'si es posible', 'entre otros', 'cuando sea necesario'].filter((term) => masked.includes(term));
    if (id === 'AMB-03')
        return original.match(PASSIVE)?.[0].trim() ? [original.match(PASSIVE)?.[0].trim() ?? ''] : [];
    if (id === 'COM-03')
        return [requirementConstraint(original)];
    if (id === 'COM-04')
        return original.match(PENDING) ?? [];
    if (id === 'COR-01')
        return [original.match(ATOMIC_PARTICIPLES)?.[0] ?? original.match(ATOMIC_VERBS)?.[0] ?? 'debe … debe'];
    if (id === 'CON-01')
        return [original.match(/^((?:RNF|RF|R)-?\d+)/i)?.[1] ?? ''];
    return [];
}
function lexicalTerms(id, original, masked) {
    const terms = RULES.find((rule) => rule.id === id)?.terms ?? [];
    return terms.filter((term) => findWord(masked, term) >= 0).map((term) => original.slice(findWord(masked, term), findWord(masked, term) + term.length));
}
function requirementConstraint(text) {
    return text.match(/(?:entre|de)\s+\d+(?:[.,]\d+)?\s+(?:y|a)\s+\d+(?:[.,]\d+)?\s*[a-záéíóúñ%]*/i)?.[0] ?? '';
}
function finding(rule, requirement, terms) {
    return { key: `${requirement.id}|${rule.id}|${requirement.line}`, reqId: requirement.id, ruleId: rule.id, attribute: rule.attribute, severity: rule.severity, title: rule.title, why: rule.why, terms };
}
