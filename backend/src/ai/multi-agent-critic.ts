import { RawGeneratedCase } from '../core/interfaces/ai-provider.interface';

export interface TestCaseCritique {
  caseCode: string;
  verdict: 'APPROVED' | 'NEEDS_CORRECTION' | 'REJECT';
  score: number; // 0 - 100
  critiqueNotes: string[];
  suggestedCorrections?: Partial<RawGeneratedCase>;
}

export interface MultiAgentAuditReport {
  overallAuditScore: number;
  reviewedCasesCount: number;
  approvedCount: number;
  correctedCount: number;
  rejectedCount: number;
  critiques: TestCaseCritique[];
  auditedCases: RawGeneratedCase[];
}

export class MultiAgentCritic {
  /**
   * Ejecuta el pipeline Multi-Agente donde el Agente 2 (Auditor ISTQB)
   * inspecciona y califica los casos de prueba generados por el Agente 1 (Generador) (Mejora #7).
   */
  static auditAndRefine(
    requirementTitle: string,
    acceptanceCriteria: string,
    cases: RawGeneratedCase[]
  ): MultiAgentAuditReport {
    const critiques: TestCaseCritique[] = [];
    const auditedCases: RawGeneratedCase[] = [];

    let totalScore = 0;
    let approvedCount = 0;
    let correctedCount = 0;
    let rejectedCount = 0;

    cases.forEach((c, idx) => {
      const caseCode = `CASE-${idx + 1}`;
      const notes: string[] = [];
      let score = 100;
      let needsCorrection = false;
      const corrections: Partial<RawGeneratedCase> = {};

      // Criterio 1: Precondiciones no vacías
      if (!c.preconditions || c.preconditions.length === 0 || !c.preconditions[0]) {
        score -= 20;
        notes.push('Faltan precondiciones explícitas para la prueba');
        corrections.preconditions = [
          `El sistema se encuentra en estado inicial válido para la funcionalidad '${requirementTitle}'`,
          'Datos maestros y dependencias configuradas',
        ];
        needsCorrection = true;
      }

      // Criterio 2: Pasos reproducibles
      if (!c.steps || c.steps.length < 2) {
        score -= 25;
        notes.push('La secuencia de pasos es insuficiente o demasiado corta para reproducción');
        corrections.steps = [
          `Acceder a la interfaz o endpoint de '${requirementTitle}'`,
          'Ingresar los datos de prueba y confirmar la transacción',
          'Verificar la respuesta del sistema',
        ];
        needsCorrection = true;
      }

      // Criterio 3: Resultado esperado claro y determinista
      if (!c.expectedResult || c.expectedResult.length < 15) {
        score -= 30;
        notes.push('El resultado esperado es ambiguo o excesivamente genérico');
        corrections.expectedResult = `El sistema procesa la operación conforme a los criterios de aceptación: "${acceptanceCriteria.slice(0, 80)}..."`;
        needsCorrection = true;
      }

      // Criterio 4: Asignación de datos de prueba
      if (!c.testData && (c.type === 'boundary' || c.type === 'negative')) {
        score -= 15;
        notes.push('Caso de frontera o negativo sin datos de prueba específicos');
        corrections.testData = 'Valor de prueba frontera generado automáticamente por el auditor ISTQB';
        needsCorrection = true;
      }

      score = Math.max(10, score);
      totalScore += score;

      let verdict: TestCaseCritique['verdict'];
      if (score >= 80) {
        verdict = 'APPROVED';
        approvedCount++;
      } else if (score >= 50) {
        verdict = 'NEEDS_CORRECTION';
        correctedCount++;
      } else {
        verdict = 'REJECT';
        rejectedCount++;
      }

      critiques.push({
        caseCode,
        verdict,
        score,
        critiqueNotes: notes.length > 0 ? notes : ['Caso cumple con estándares ISTQB de verificabilidad y atomicidad'],
        suggestedCorrections: needsCorrection ? corrections : undefined,
      });

      // Crear caso auditado y refinado
      auditedCases.push({
        ...c,
        preconditions: corrections.preconditions || c.preconditions,
        steps: corrections.steps || c.steps,
        expectedResult: corrections.expectedResult || c.expectedResult,
        testData: corrections.testData || c.testData,
      });
    });

    const overallAuditScore = cases.length > 0 ? Math.round(totalScore / cases.length) : 100;

    return {
      overallAuditScore,
      reviewedCasesCount: cases.length,
      approvedCount,
      correctedCount,
      rejectedCount,
      critiques,
      auditedCases,
    };
  }
}
