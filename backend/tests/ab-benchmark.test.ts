import { describe, it, expect } from 'vitest';
import { ABBenchmarkService } from '../src/services/ab-benchmark.service';

describe('ABBenchmarkService (Mejora #50)', () => {
  it('compara dos candidatos de generación y determina un ganador objetivo', () => {
    const candidateA = {
      name: 'Gemini-1.5-Pro',
      latencyMs: 1200,
      tokens: 350,
      cost: 0.0012,
      cases: [
        {
          title: 'Login con usuario estándar',
          expectedResult: 'El sistema valida las credenciales y devuelve token en 200ms',
        },
      ],
    };

    const candidateB = {
      name: 'Fallback-Heuristic-Offline',
      latencyMs: 15,
      tokens: 0,
      cost: 0.0,
      cases: [
        {
          title: 'Login determinista',
          expectedResult: 'El sistema valida positivamente la solicitud conforme a criterios',
        },
      ],
    };

    const comparison = ABBenchmarkService.compareResults('REQ-001', candidateA, candidateB);

    expect(comparison.testedRequirementCode).toBe('REQ-001');
    expect(comparison.candidateA.candidateName).toBe('Gemini-1.5-Pro');
    expect(comparison.candidateB.candidateName).toBe('Fallback-Heuristic-Offline');
    expect(['CANDIDATE_A', 'CANDIDATE_B', 'TIE']).toContain(comparison.winner);
    expect(comparison.summaryAnalysis).toBeDefined();
  });
});
