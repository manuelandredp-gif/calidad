import { describe, expect, it } from 'vitest';
import { analyze, suggestFix, improve, applyReplacements } from '../src/index.js';
import { GOLDEN_TEXT } from './fixtures.js';

describe('suggestFix', () => {
  it('AMB-01: sustituye término subjetivo por cláusula medible', () => {
    const a = analyze('RNF-01 El sistema debe ser rápido.');
    const req = a.requirements[0]!;
    const fix = suggestFix('AMB-01', req, a.requirements);
    expect(fix).toContain('responder en menos de');
    expect(fix).toContain('‹2 s›');
  });

  it('AMB-02: reemplaza y/o por y, elimina etc.', () => {
    const a = analyze('RF-01 Exportar a PDF y/o Excel, etc.');
    const req = a.requirements[0]!;
    const fix = suggestFix('AMB-02', req, a.requirements);
    expect(fix).toContain(' y ');
    expect(fix).not.toContain('y/o');
    expect(fix).not.toContain('etc.');
  });

  it('VER-02: reemplaza cuantificador vago por marcador', () => {
    const a = analyze('RF-01 El sistema debe soportar varios usuarios.');
    const req = a.requirements[0]!;
    const fix = suggestFix('VER-02', req, a.requirements);
    expect(fix).toContain('‹100›');
    expect(fix).not.toContain('varios');
  });

  it('COM-01: agrega sujeto', () => {
    const a = analyze('Permitir el registro de clientes.');
    const req = a.requirements[0]!;
    const fix = suggestFix('COM-01', req, a.requirements);
    expect(fix.toLowerCase()).toContain('el sistema debe');
  });

  it('COM-03: agrega comportamiento ante valores inválidos', () => {
    const a = analyze('RF-01 El sistema debe aceptar contraseña de entre 8 y 16 caracteres.');
    const req = a.requirements[0]!;
    const fix = suggestFix('COM-03', req, a.requirements);
    expect(fix).toContain('rechazar cualquier otro valor');
    expect(fix).toContain('mensaje de error');
  });

  it('COM-04: devuelve el texto sin cambios', () => {
    const a = analyze('RF-01 El tiempo máximo es TBD.');
    const req = a.requirements[0]!;
    const fix = suggestFix('COM-04', req, a.requirements);
    expect(fix).toContain('TBD');
  });

  it('VIA-01: reemplaza absolutos por porcentajes', () => {
    const a = analyze('RF-01 El sistema debe estar disponible siempre.');
    const req = a.requirements[0]!;
    const fix = suggestFix('VIA-01', req, a.requirements);
    expect(fix).toContain('99,5 %');
    expect(fix).not.toContain('siempre');
  });

  it('PRI-01: agrega prioridad media', () => {
    const a = analyze('RF-01 El sistema debe guardar.');
    const req = a.requirements[0]!;
    const fix = suggestFix('PRI-01', req, a.requirements);
    expect(fix).toContain('Prioridad: Media');
  });

  it('CON-01: cambia ID duplicado', () => {
    const a = analyze('RF-02 El sistema debe guardar.\nRF-02 El sistema debe eliminar.');
    const req = a.requirements[1]!;
    const fix = suggestFix('CON-01', req, a.requirements);
    expect(fix).not.toMatch(/^RF-02\b/);
  });
});

describe('improve', () => {
  it('encadena correcciones del golden text RF-01', () => {
    const a = analyze(GOLDEN_TEXT);
    const req = a.requirements[0]!;
    const findings = a.findings.filter((f) => f.reqId === req.id);
    const result = improve(req, findings.map((f) => f.ruleId), a.requirements);
    expect(result).toContain('rechazar cualquier otro valor');
    expect(result).toContain('Prioridad: Media');
  });

  it('encadena correcciones del golden text RNF-01', () => {
    const a = analyze(GOLDEN_TEXT);
    const req = a.requirements[1]!;
    const findings = a.findings.filter((f) => f.reqId === req.id);
    const result = improve(req, findings.map((f) => f.ruleId), a.requirements);
    expect(result).toContain('responder en menos de');
    expect(result).toContain('Prioridad: Media');
  });
});

describe('applyReplacements', () => {
  it('reemplaza líneas manteniendo la estructura', () => {
    const text = 'RF-01 Original uno.\nRF-02 Original dos.';
    const a = analyze(text);
    const result = applyReplacements(text, [
      { req: a.requirements[0]!, replacement: 'RF-01 Mejorado uno.' },
    ]);
    expect(result).toContain('RF-01 Mejorado uno.');
    expect(result).toContain('RF-02 Original dos.');
  });

  it('agrega ID si la corrección no lo trae', () => {
    const text = 'RF-01 Original.';
    const a = analyze(text);
    const result = applyReplacements(text, [
      { req: a.requirements[0]!, replacement: 'Mejorado sin ID.' },
    ]);
    expect(result).toMatch(/^RF-01/);
  });
});
