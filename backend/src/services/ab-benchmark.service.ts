import { AmbiguityDetectorISO29148 } from '../core/heuristics/ambiguity-detector';

export interface BenchmarkCandidateResult {
  candidateName: string;
  latencyMs: number;
  tokensConsumed: number;
  estimatedCostUsd: number;
  casesCount: number;
  clarityScore: number;
}

export interface BenchmarkComparison {
  testedRequirementCode: string;
  candidateA: BenchmarkCandidateResult;
  candidateB: BenchmarkCandidateResult;
  winner: 'CANDIDATE_A' | 'CANDIDATE_B' | 'TIE';
  efficiencyRatio: number; // Factor de mejora en velocidad o costo
  summaryAnalysis: string;
}

export class ABBenchmarkService {
  /**
   * Realiza un estudio comparativo A/B de rendimiento y calidad entre dos configuraciones o modelos (Mejora #50).
   */
  static compareResults(
    requirementCode: string,
    resultA: { name: string; latencyMs: number; tokens: number; cost: number; cases: Array<{ title: string; expectedResult: string }> },
    resultB: { name: string; latencyMs: number; tokens: number; cost: number; cases: Array<{ title: string; expectedResult: string }> }
  ): BenchmarkComparison {
    // Calcular calidad lingüística y determinismo de cada conjunto
    const qualityA = this.evaluateBatchQuality(resultA.cases);
    const qualityB = this.evaluateBatchQuality(resultB.cases);

    const candA: BenchmarkCandidateResult = {
      candidateName: resultA.name,
      latencyMs: resultA.latencyMs,
      tokensConsumed: resultA.tokens,
      estimatedCostUsd: resultA.cost,
      casesCount: resultA.cases.length,
      clarityScore: qualityA,
    };

    const candB: BenchmarkCandidateResult = {
      candidateName: resultB.name,
      latencyMs: resultB.latencyMs,
      tokensConsumed: resultB.tokens,
      estimatedCostUsd: resultB.cost,
      casesCount: resultB.cases.length,
      clarityScore: qualityB,
    };

    // Puntaje multidimensional: 40% calidad, 30% velocidad, 30% costo
    const scoreA = qualityA * 0.4 + (1000 / (resultA.latencyMs + 10)) * 30 - resultA.cost * 1000;
    const scoreB = qualityB * 0.4 + (1000 / (resultB.latencyMs + 10)) * 30 - resultB.cost * 1000;

    let winner: 'CANDIDATE_A' | 'CANDIDATE_B' | 'TIE' = 'TIE';
    if (scoreA > scoreB * 1.05) winner = 'CANDIDATE_A';
    else if (scoreB > scoreA * 1.05) winner = 'CANDIDATE_B';

    const efficiencyRatio =
      resultB.latencyMs > 0 ? parseFloat((resultA.latencyMs / resultB.latencyMs).toFixed(2)) : 1;

    const summaryAnalysis =
      winner === 'CANDIDATE_A'
        ? `${resultA.name} superó a ${resultB.name} en equilibrio de calidad y latencia (${qualityA}/100 vs ${qualityB}/100).`
        : winner === 'CANDIDATE_B'
        ? `${resultB.name} demostró superioridad operativa frente a ${resultA.name}.`
        : `Ambos modelos mostraron paridad técnica y estadística para este requisito.`;

    return {
      testedRequirementCode: requirementCode,
      candidateA: candA,
      candidateB: candB,
      winner,
      efficiencyRatio,
      summaryAnalysis,
    };
  }

  private static evaluateBatchQuality(cases: Array<{ title: string; expectedResult: string }>): number {
    if (cases.length === 0) return 0;
    const scores = cases.map((c) => {
      const report = AmbiguityDetectorISO29148.analyze(c.title, c.expectedResult);
      return report.overallScore;
    });
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }
}
