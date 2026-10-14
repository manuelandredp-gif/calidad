import { describe, expect, it } from 'vitest';
import { analyze } from '../src/index.js';

describe('generación de casos', () => {
  it('rango genera 7 casos (o menos si hay valores repetidos)', () => {
    const a = analyze('RF-01 El sistema debe aceptar entre 8 y 16 caracteres.');
    expect(a.cases.length).toBeGreaterThanOrEqual(5);
    expect(a.cases.length).toBeLessThanOrEqual(7);
    const types = a.cases.map((c) => c.type);
    expect(types).toContain('valido');
    expect(types).toContain('invalido');
    expect(types).toContain('limite');
  });

  it('umbral estricto genera 3 casos', () => {
    const a = analyze('RNF-01 El sistema debe responder en menos de 30 s.');
    expect(a.cases).toHaveLength(3);
    expect(a.cases[0]!.type).toBe('nf');
    expect(a.cases[1]!.type).toBe('limite');
    expect(a.cases[2]!.type).toBe('invalido');
    expect(a.cases[1]!.expected).toContain('No cumple');
  });

  it('umbral inclusivo genera 3 casos con cumple en el límite', () => {
    const a = analyze('RNF-01 El sistema debe responder como máximo 5 s.');
    expect(a.cases).toHaveLength(3);
    expect(a.cases[1]!.expected).toContain('Cumple: justo en el máximo');
  });

  it('condición con dinero genera 3 casos con paso 0.01', () => {
    const a = analyze('RF-01 Si el monto supera S/ 500, el sistema debe aplicar un descuento.');
    expect(a.cases).toHaveLength(3);
    expect(a.cases[0]!.value).toBe(500.01);
    expect(a.cases[0]!.data).toContain('S/ 500.01');
    expect(a.cases[0]!.expected).toContain('Se ejecuta');
  });

  it('condición sin dinero genera 3 casos con paso 1', () => {
    const a = analyze('RF-01 Si la cantidad supera 10, el sistema debe alertar.');
    expect(a.cases).toHaveLength(3);
    expect(a.cases[0]!.value).toBe(11);
  });

  it('máximo genera 3 casos', () => {
    const a = analyze('RF-01 El sistema permite máximo 5 intentos.');
    expect(a.cases).toHaveLength(3);
    expect(a.cases[2]!.type).toBe('invalido');
  });

  it('mínimo genera 3 casos', () => {
    const a = analyze('RF-01 El sistema requiere como mínimo 3 caracteres.');
    expect(a.cases).toHaveLength(3);
    expect(a.cases[0]!.type).toBe('invalido');
  });

  it('carga genera 1 caso no funcional', () => {
    const a = analyze('RNF-01 El sistema debe soportar 200 usuarios concurrentes.');
    expect(a.cases).toHaveLength(1);
    expect(a.cases[0]!.type).toBe('nf');
    expect(a.cases[0]!.technique).toBe('Perfil de carga');
  });

  it('sin restricción no genera casos', () => {
    const a = analyze('RNF-01 El sistema debe tener buen rendimiento.');
    expect(a.cases).toHaveLength(0);
  });

  it('IDs de caso siguen el formato TC-RFNN-NN', () => {
    const a = analyze('RF-01 El sistema debe aceptar entre 8 y 16 caracteres.');
    for (const c of a.cases) {
      expect(c.id).toMatch(/^TC-RF\d+-\d{2}$/);
    }
  });

  it('prioridad heredada del requisito', () => {
    const a = analyze('RF-01 El sistema debe aceptar entre 8 y 16 caracteres. Prioridad: Alta');
    for (const c of a.cases) {
      expect(c.priority).toBe('Alta');
    }
  });
});
