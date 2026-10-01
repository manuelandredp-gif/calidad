import { describe, it, expect } from 'vitest';
import { ClassificationTreeEngine } from '../src/heuristic/classification-tree';

describe('ClassificationTreeEngine (Mejora #14)', () => {
  it('genera caso base nominal y variaciones negativas para clases inválidas', () => {
    const aspects = [
      {
        id: 'A1',
        name: 'Monto de Compra',
        classes: [
          { id: 'C1', name: 'Monto Estándar (1 - 500)', isValid: true, sampleValue: '150' },
          { id: 'C2', name: 'Monto Cero o Negativo', isValid: false, sampleValue: '-10' },
        ],
      },
      {
        id: 'A2',
        name: 'Tipo de Cliente',
        classes: [
          { id: 'C3', name: 'Cliente Premium', isValid: true, sampleValue: 'PREMIUM' },
          { id: 'C4', name: 'Cliente Regular', isValid: true, sampleValue: 'REGULAR' },
        ],
      },
    ];

    const result = ClassificationTreeEngine.generateCases('Checkout de Compra', aspects);

    expect(result.testCasesCount).toBeGreaterThanOrEqual(3);

    // Debe contener caso nominal positivo
    const nominal = result.cases.find((c) => c.title.includes('Nominal'));
    expect(nominal).toBeDefined();
    expect(nominal?.type).toBe('positive');

    // Debe contener prueba negativa para el monto inválido
    const invalid = result.cases.find((c) => c.type === 'negative');
    expect(invalid).toBeDefined();
    expect(invalid?.title).toContain('Rechazo');
  });
});
