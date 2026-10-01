import { describe, it, expect } from 'vitest';
import { MultiAgentCritic } from '../src/ai/multi-agent-critic';
import { RawGeneratedCase } from '../src/core/interfaces/ai-provider.interface';

describe('MultiAgentCritic (Mejora #7)', () => {
  it('detecta deficiencias y auto-corrige precondiciones vacías o pasos insuficientes', () => {
    const incompleteCases: RawGeneratedCase[] = [
      {
        type: 'positive',
        title: 'Caso con datos faltantes',
        preconditions: [], // Deficiencia
        steps: ['Paso único'], // Deficiencia (< 2 pasos)
        testData: null,
        expectedResult: 'OK', // Deficiencia (< 15 chars)
        priority: 'high',
        evidenceStatus: 'derived',
      },
    ];

    const report = MultiAgentCritic.auditAndRefine(
      'Pago con Tarjeta',
      'Dado un saldo positivo, cuando paga, se emite voucher',
      incompleteCases
    );

    expect(report.reviewedCasesCount).toBe(1);
    expect(report.critiques[0].verdict).toMatch(/NEEDS_CORRECTION|REJECT/);
    expect(report.critiques[0].critiqueNotes.length).toBeGreaterThanOrEqual(2);

    // Los casos auditados deben haber sido auto-corregidos
    const refined = report.auditedCases[0];
    expect(refined.preconditions.length).toBeGreaterThan(0);
    expect(refined.steps.length).toBeGreaterThanOrEqual(2);
    expect(refined.expectedResult.length).toBeGreaterThanOrEqual(15);
  });
});
