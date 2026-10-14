import { describe, expect, it } from 'vitest';
import { analyze } from '../src/index.js';
import { GOLDEN_TEXT } from './fixtures.js';
describe('ejemplo de referencia', () => {
    it('produce seis requisitos, trece sospechas y trece casos pendientes del hito 2', () => {
        const result = analyze(GOLDEN_TEXT);
        expect(result.requirements).toHaveLength(6);
        expect(result.findings).toHaveLength(13);
        expect(result.cases).toHaveLength(0);
    });
    it('mantiene una huella estable', () => {
        expect(analyze(GOLDEN_TEXT).hash).toBe(analyze(GOLDEN_TEXT).hash);
    });
});
