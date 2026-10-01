import { describe, it, expect } from 'vitest';
import { HeuristicEngine } from '../src/core/heuristics/heuristic-engine';

describe('HeuristicEngine.generateDeterministicTestCases', () => {
  it('genera al menos un caso positivo base sin consumir IA', () => {
    const { cases } = HeuristicEngine.generateDeterministicTestCases(
      'REQ-001',
      'Registro de usuario',
      'El usuario debe poder registrarse con correo y contraseña válidos.',
      'El campo contraseña debe tener entre 8 y 20 caracteres.'
    );
    expect(cases.length).toBeGreaterThan(0);
    expect(cases.some((c) => c.type === 'positive')).toBe(true);
  });

  it('es determinista: dos ejecuciones idénticas producen el mismo resultado', () => {
    const args = [
      'REQ-002',
      'Login',
      'El usuario inicia sesión.',
      'Dado un usuario válido Cuando ingresa credenciales Entonces accede al sistema',
    ] as const;
    const a = HeuristicEngine.generateDeterministicTestCases(...args);
    const b = HeuristicEngine.generateDeterministicTestCases(...args);
    expect(a.cases.length).toBe(b.cases.length);
    expect(a.cases.map((c) => c.title)).toEqual(b.cases.map((c) => c.title));
  });

  it('detecta sintaxis Gherkin en los criterios de aceptación', () => {
    const { rulesMatched } = HeuristicEngine.generateDeterministicTestCases(
      'REQ-003',
      'Compra',
      'Proceso de compra',
      'Dado un carrito con productos\nCuando confirmo el pago\nEntonces recibo la boleta'
    );
    expect(rulesMatched.some((r) => r.ruleType === 'BDD_GHERKIN')).toBe(true);
  });
});
