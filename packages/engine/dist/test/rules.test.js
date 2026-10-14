import { describe, expect, it } from 'vitest';
import { analyze, RULES } from '../src/index.js';
const reservedRules = new Set(['CON-02', 'NEC-01']);
describe('catálogo de reglas', () => {
    it('contiene las quince reglas con ejemplos de diseño', () => {
        expect(RULES).toHaveLength(15);
        RULES.forEach((rule) => {
            expect(rule.examples.bad.length).toBeGreaterThan(0);
            expect(rule.examples.good.length).toBeGreaterThan(0);
        });
    });
    it.each(RULES.filter((rule) => !reservedRules.has(rule.id)))('$id detecta su ejemplo malo', (rule) => {
        const text = rule.id === 'CON-01' ? 'RF-02 El sistema debe guardar.\nRF-02 El sistema debe eliminar.' : rule.examples.bad[0] ?? '';
        expect(analyze(text).findings.map((finding) => finding.ruleId)).toContain(rule.id);
    });
    it.each(RULES.filter((rule) => !reservedRules.has(rule.id)))('$id no detecta su ejemplo bueno', (rule) => {
        const text = rule.examples.good[0] ?? '';
        expect(analyze(text).findings.map((finding) => finding.ruleId)).not.toContain(rule.id);
    });
    it.each([...reservedRules])('%s queda reservada para juicio humano o una fase posterior', (ruleId) => {
        const rule = RULES.find((entry) => entry.id === ruleId);
        expect(analyze(rule?.examples.bad[0] ?? '').findings.map((finding) => finding.ruleId)).not.toContain(ruleId);
    });
});
