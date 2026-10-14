import type { Finding, Requirement } from './types.js';

const ATTRIBUTES = ['no_ambiguo', 'verificable', 'completo', 'viable', 'priorizable', 'consistente'] as const;

export function scoreRequirement(reqId: string, findings: Finding[]): number {
  const affected = new Set(findings.filter((item) => item.reqId === reqId).map((item) => item.attribute));
  return Math.round(ATTRIBUTES.filter((attribute) => !affected.has(attribute)).length / ATTRIBUTES.length * 100);
}

export function globalScore(requirements: Requirement[], findings: Finding[]): number {
  if (!requirements.length) return 0;
  return Math.round(requirements.reduce((sum, requirement) => sum + scoreRequirement(requirement.id, findings), 0) / requirements.length);
}
