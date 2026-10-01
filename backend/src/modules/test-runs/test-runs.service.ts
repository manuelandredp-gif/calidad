// ==============================================================================
// Module: TestRunsService (Mejoras 41, 42, 43, 44, 45, 46)
// Ciclos de Ejecución de Pruebas, Registro de Defectos en 1 Clic,
// Métricas en Tiempo Real, Comparador Histórico y Temporizador por Caso.
// ==============================================================================

import { prisma } from '../../config/prisma';
import { ApiError } from '../../common/errors/api-error';

export type ExecutionStatus = 'PASSED' | 'FAILED' | 'BLOCKED' | 'SKIPPED' | 'PENDING';

export interface TestCaseExecutionResult {
  testCaseId: string;
  code: string;
  title: string;
  status: ExecutionStatus;
  durationSeconds: number; // Mejora 46: Temporizador por caso
  executedAt: string | null;
  executedBy: string | null;
  evidenceText: string | null; // Mejora 43: Evidencia de logs/HTTP
  defectNotes: string | null;
  defectLogged: boolean; // Mejora 42: Registro de defectos con 1 clic
}

export interface TestRun {
  id: string;
  projectId: string;
  name: string;
  environment: string; // ej. "QA", "Staging", "Production Sandbox"
  createdAt: string;
  updatedAt: string;
  status: 'IN_PROGRESS' | 'COMPLETED';
  cases: TestCaseExecutionResult[];
}

// Almacenamiento seguro en memoria/caché transaccional para ciclos de ejecución
const testRunsStore = new Map<string, TestRun>();

export class TestRunsService {
  /**
   * Mejora 41: Crea un nuevo ciclo de ejecución (Test Run) para un proyecto.
   */
  public static async createRun(
    projectId: string,
    name: string,
    environment = 'QA Sandbox',
    caseIds?: string[]
  ): Promise<TestRun> {
    let where: Record<string, unknown> = {
      requirement: { projectId },
      status: 'APPROVED',
      isObsolete: false,
    };

    if (caseIds && caseIds.length > 0) {
      where = {
        requirement: { projectId },
        id: { in: caseIds },
        isObsolete: false,
      };
    }

    let testCases = await prisma.testCase.findMany({
      where,
      orderBy: { code: 'asc' },
    });

    // Si aún no han sido aprobados, permitir ejecutar los casos activos disponibles
    if (testCases.length === 0) {
      testCases = await prisma.testCase.findMany({
        where: {
          requirement: { projectId },
          isObsolete: false,
        },
        take: 50,
        orderBy: { code: 'asc' },
      });
    }

    if (testCases.length === 0) {
      throw ApiError.badRequest('No hay casos de prueba registrados en el proyecto para iniciar la ejecución.');
    }

    const runId = `run_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const runCases: TestCaseExecutionResult[] = testCases.map((tc) => ({
      testCaseId: tc.id,
      code: tc.code,
      title: tc.title,
      status: 'PENDING',
      durationSeconds: 0,
      executedAt: null,
      executedBy: null,
      evidenceText: null,
      defectNotes: null,
      defectLogged: false,
    }));

    const newRun: TestRun = {
      id: runId,
      projectId,
      name,
      environment,
      createdAt: now,
      updatedAt: now,
      status: 'IN_PROGRESS',
      cases: runCases,
    };

    testRunsStore.set(runId, newRun);
    return newRun;
  }

  public static getRun(runId: string): TestRun {
    const run = testRunsStore.get(runId);
    if (!run) throw ApiError.notFound(`Ciclo de ejecución '${runId}' no encontrado.`);
    return run;
  }

  public static listRunsByProject(projectId: string): TestRun[] {
    return Array.from(testRunsStore.values()).filter((r) => r.projectId === projectId);
  }

  /**
   * Mejora 43 & 46: Registra el resultado, duración en segundos y evidencia multimedia/logs.
   */
  public static recordExecution(
    runId: string,
    caseId: string,
    status: ExecutionStatus,
    durationSeconds = 0,
    evidenceText?: string,
    executedBy = 'QA Tester'
  ): TestCaseExecutionResult {
    const run = this.getRun(runId);
    const item = run.cases.find((c) => c.testCaseId === caseId);
    if (!item) throw ApiError.notFound(`Caso '${caseId}' no pertenece al ciclo '${runId}'.`);

    item.status = status;
    item.durationSeconds = durationSeconds;
    item.executedAt = new Date().toISOString();
    item.executedBy = executedBy;
    if (evidenceText !== undefined) {
      item.evidenceText = evidenceText;
    }

    run.updatedAt = new Date().toISOString();
    return item;
  }

  /**
   * Mejora 42: Registro de Defectos con 1 Clic desde el caso fallido.
   */
  public static async logDefectFromRun(
    runId: string,
    caseId: string,
    defectNotes: string,
    userId: string
  ) {
    const run = this.getRun(runId);
    const item = run.cases.find((c) => c.testCaseId === caseId);
    if (!item) throw ApiError.notFound('Caso no encontrado.');

    const originalCase = await prisma.testCase.findUnique({
      where: { id: caseId },
      include: { requirement: true },
    });

    if (!originalCase) throw ApiError.notFound('Caso en base de datos no encontrado.');

    item.defectLogged = true;
    item.defectNotes = defectNotes;

    const defectReport = {
      defectId: `DEF-${Date.now().toString().slice(-5)}`,
      testCaseCode: item.code,
      requirementCode: originalCase.requirement.code,
      title: `[Fallo en Ejecución] ${item.title}`,
      stepsToReproduce: originalCase.steps,
      expectedResult: originalCase.expectedResult,
      actualResult: defectNotes,
      evidence: item.evidenceText || 'Sin traza adjunta',
      severity: originalCase.priority === 'high' ? 'CRITICAL' : 'MAJOR',
      environment: run.environment,
      reportedBy: userId,
      reportedAt: new Date().toISOString(),
    };

    return defectReport;
  }

  /**
   * Mejora 44: Métricas de Ejecución en Tiempo Real.
   */
  public static getRunMetrics(runId: string) {
    const run = this.getRun(runId);
    const total = run.cases.length;
    const passed = run.cases.filter((c) => c.status === 'PASSED').length;
    const failed = run.cases.filter((c) => c.status === 'FAILED').length;
    const blocked = run.cases.filter((c) => c.status === 'BLOCKED').length;
    const skipped = run.cases.filter((c) => c.status === 'SKIPPED').length;
    const pending = run.cases.filter((c) => c.status === 'PENDING').length;

    const executed = total - pending;
    const passRate = executed > 0 ? parseFloat(((passed / executed) * 100).toFixed(2)) : 0;
    const totalDurationSeconds = run.cases.reduce((acc, c) => acc + c.durationSeconds, 0);
    const avgDurationSeconds = executed > 0 ? parseFloat((totalDurationSeconds / executed).toFixed(1)) : 0;

    return {
      runId: run.id,
      name: run.name,
      environment: run.environment,
      totalCases: total,
      executedCases: executed,
      passed,
      failed,
      blocked,
      skipped,
      pending,
      passRatePercent: passRate,
      defectsLogged: run.cases.filter((c) => c.defectLogged).length,
      totalDurationSeconds,
      avgDurationSeconds,
      isCompleted: pending === 0,
    };
  }

  /**
   * Mejora 45: Comparador Histórico de Ejecuciones (Sprint A vs Sprint B).
   */
  public static compareRuns(runIdA: string, runIdB: string) {
    const metricsA = this.getRunMetrics(runIdA);
    const metricsB = this.getRunMetrics(runIdB);
    const runA = this.getRun(runIdA);
    const runB = this.getRun(runIdB);

    // Detectar casos que pasaron en A pero fallaron en B (Regresiones!)
    const regressions: Array<{ code: string; title: string }> = [];

    const mapA = new Map(runA.cases.map((c) => [c.code, c.status]));
    runB.cases.forEach((c) => {
      const prevStatus = mapA.get(c.code);
      if (prevStatus === 'PASSED' && c.status === 'FAILED') {
        regressions.push({ code: c.code, title: c.title });
      }
    });

    return {
      runA: metricsA,
      runB: metricsB,
      passRateDeltaPercent: parseFloat((metricsB.passRatePercent - metricsA.passRatePercent).toFixed(2)),
      detectedRegressionsCount: regressions.length,
      regressions,
    };
  }
}
