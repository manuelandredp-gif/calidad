import { describe, it, expect } from 'vitest';
import { DecisionTableEngine } from '../src/core/heuristics/decision-table';

describe('DecisionTableEngine (Mejora #11)', () => {
  it('genera una tabla de decisión completa a partir de condiciones y acciones', () => {
    const conditions = [
      { id: 'C1', name: 'Saldo suficiente', values: ['Sí', 'No'] },
      { id: 'C2', name: 'Tarjeta activa', values: ['Sí', 'No'] },
    ];
    const actions = [
      { id: 'A1', name: 'Aprobar Retiro', expectedOutcome: 'Dispensar efectivo' },
      { id: 'A2', name: 'Rechazar Retiro', expectedOutcome: 'Mostrar error de fondos o tarjeta' },
    ];

    const result = DecisionTableEngine.generateFromConditionsAndActions(
      'Retiro en Cajero',
      conditions,
      actions
    );

    // 2 condiciones binarias = 4 reglas
    expect(result.rules).toHaveLength(4);
    expect(result.cases).toHaveLength(4);

    // Debe contener casos positivos y negativos
    const positiveCases = result.cases.filter((c) => c.type === 'positive');
    const negativeCases = result.cases.filter((c) => c.type === 'negative');

    expect(positiveCases.length).toBeGreaterThan(0);
    expect(negativeCases.length).toBeGreaterThan(0);
    expect(result.cases[0].title).toContain('[Tabla de Decisión');
  });

  it('infiere condiciones y acciones automáticamente desde texto de requisitos', () => {
    const text = `
      Si el usuario ingresa credenciales válidas entonces el sistema debe permitir el acceso al panel.
      Si las credenciales son incorrectas el sistema debe rechazar la solicitud y mostrar error.
    `;

    const result = DecisionTableEngine.parseTextToDecisionTable('Autenticación', text);
    expect(result.conditions.length).toBeGreaterThan(0);
    expect(result.actions.length).toBeGreaterThan(0);
    expect(result.rules.length).toBeGreaterThan(0);
  });
});
