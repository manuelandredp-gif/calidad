export interface StaleEvaluation {
  testCaseId: string;
  isStale: boolean;
  reason?: string;
  ageDays: number;
  requirementVersionGap: number;
}

export interface StaleDetectorInput {
  requirementUpdatedAt: Date | string;
  requirementVersion: number;
  testCases: Array<{
    id: string;
    createdAt: Date | string;
    updatedAt: Date | string;
    status: string;
  }>;
}

export class StaleDetectorService {
  /**
   * Evalúa qué casos de prueba están desactualizados tras modificaciones del requisito base (Mejora #49).
   */
  static evaluateTestCases(input: StaleDetectorInput): StaleEvaluation[] {
    const reqUpdated = new Date(input.requirementUpdatedAt).getTime();
    const now = Date.now();

    return input.testCases.map((tc) => {
      const tcCreated = new Date(tc.createdAt).getTime();
      const tcUpdated = new Date(tc.updatedAt).getTime();
      const ageDays = Math.floor((now - tcCreated) / (1000 * 60 * 60 * 24));

      // Si el requisito se actualizó más de 5 segundos después de que el caso fue creado/editado
      const wasModifiedAfterCase = reqUpdated > Math.max(tcCreated, tcUpdated) + 5000;

      let isStale = false;
      let reason: string | undefined;

      if (wasModifiedAfterCase) {
        isStale = true;
        reason = `El requisito fue modificado tras la creación del caso (${new Date(reqUpdated).toLocaleDateString()}). Se recomienda re-evaluar la cobertura.`;
      } else if (ageDays > 90 && tc.status === 'PENDING') {
        isStale = true;
        reason = `El caso de prueba lleva más de ${ageDays} días en estado PENDIENTE sin revisión.`;
      }

      return {
        testCaseId: tc.id,
        isStale,
        reason,
        ageDays,
        requirementVersionGap: isStale ? 1 : 0,
      };
    });
  }
}
