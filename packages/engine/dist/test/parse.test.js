import { describe, expect, it } from 'vitest';
import { analyze } from '../src/index.js';
describe('segmentación y parseo', () => {
    it('omite líneas vacías y preserva el índice original', () => {
        const requirements = analyze('\nRF-01 El sistema debe guardar.\n\nRNF-02 El sistema debe responder en menos de 2 s.').requirements;
        expect(requirements.map((item) => item.line)).toEqual([1, 3]);
    });
    it('asigna IDs sintéticos y extrae prioridad', () => {
        const requirements = analyze('El sistema debe guardar.\nRF-02 El sistema debe borrar. Prioridad: Alta').requirements;
        expect(requirements.map((item) => [item.id, item.priority])).toEqual([['R-01', null], ['RF-02', 'Alta']]);
    });
    it('extrae la primera restricción aplicable', () => {
        const requirement = analyze('RF-01 El sistema debe aceptar entre 8 y 16 caracteres en menos de 2 s.').requirements[0];
        expect(requirement?.constraint).toMatchObject({ type: 'rango', a: 8, b: 16, unit: 'caracteres' });
    });
});
