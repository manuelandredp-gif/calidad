import { describe, it, expect } from 'vitest';
import { StateTransitionEngine, StateMachineModel } from '../src/core/heuristics/state-transition';

describe('StateTransitionEngine (Mejora #12)', () => {
  it('genera casos de cobertura 0-Switch, 1-Switch y Transiciones Inválidas', () => {
    const model: StateMachineModel = {
      title: 'Documento',
      states: ['BORRADOR', 'PUBLICADO', 'ARCHIVADO'],
      initialState: 'BORRADOR',
      finalStates: ['ARCHIVADO'],
      transitions: [
        { id: 'T1', fromState: 'BORRADOR', event: 'Publicar', toState: 'PUBLICADO', action: 'Hacer visible', isValid: true },
        { id: 'T2', fromState: 'PUBLICADO', event: 'Archivar', toState: 'ARCHIVADO', action: 'Mover a histórico', isValid: true },
      ],
    };

    const result = StateTransitionEngine.generateTestCases(model);

    // Debe contener casos 0-Switch (transiciones individuales)
    const zeroSwitch = result.cases.filter((c) => c.title.includes('0-Switch'));
    expect(zeroSwitch.length).toBe(2);

    // Debe contener transiciones inválidas (ej. intentar archivar desde borrador o publicar desde archivado)
    const invalidTransitions = result.cases.filter((c) => c.title.includes('Transición Inválida'));
    expect(invalidTransitions.length).toBeGreaterThan(0);

    // Debe contener secuencias 1-Switch (BORRADOR -> PUBLICADO -> ARCHIVADO)
    const oneSwitch = result.cases.filter((c) => c.title.includes('1-Switch'));
    expect(oneSwitch.length).toBe(1);
  });

  it('detecta arquetipos de ciclo de vida comunes (pedidos, usuarios) a partir de texto', () => {
    const text = 'El sistema gestiona el flujo de pedidos y compras desde su creación hasta la entrega.';
    const result = StateTransitionEngine.parseFromText('Gestión de Pedidos', text);

    expect(result.model.states).toContain('CREADO');
    expect(result.model.states).toContain('ENTREGADO');
    expect(result.cases.length).toBeGreaterThan(5);
  });
});
