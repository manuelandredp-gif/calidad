import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/prisma';
import { sendSuccess } from '../../common/utils/api-response';
import { authenticateJWT } from '../../common/middleware/auth.middleware';
import { asyncHandler } from '../../common/middleware/async-handler';
import { assertRequirementAccess } from '../../common/utils/ownership';
import { HeuristicEngine } from '../../core/heuristics/heuristic-engine';
import { GenerateHeuristicsUseCase } from '../../application/use-cases/generate-heuristics.use-case';

export const heuristicsRouter = Router();

heuristicsRouter.use(authenticateJWT);

const generateHeuristicSchema = z.object({
  requirementId: z.string().uuid('ID de requisito inválido'),
  clearPrevious: z.boolean().optional().default(false),
});

// POST /api/heuristics/generate - Generación determinista por reglas ISTQB (0 tokens, offline)
heuristicsRouter.post(
  '/generate',
  asyncHandler(async (req: Request, res: Response) => {
    const { requirementId, clearPrevious } = generateHeuristicSchema.parse(req.body);
    const requirement = await assertRequirementAccess(requirementId, req.user!.userId, req.user!.role);

    const startTime = Date.now();
    const { cases, rulesMatched } = HeuristicEngine.generateDeterministicTestCases(
      requirement.code,
      requirement.title,
      requirement.description,
      requirement.acceptanceCriteria
    );
    const executionTimeMs = Date.now() - startTime;

    const created = await prisma.$transaction(async (tx) => {
      if (clearPrevious) {
        await tx.testCase.deleteMany({ where: { requirementId, status: 'PENDING' } });
      }
      const existingCount = await tx.testCase.count({ where: { requirementId } });

      const createdCases = [];
      for (let i = 0; i < cases.length; i++) {
        const c = cases[i];
        const code = `CP-${String(existingCount + i + 1).padStart(3, '0')}`;
        const newCase = await tx.testCase.create({
          data: {
            requirementId,
            code,
            type: c.type,
            title: c.title,
            preconditions: JSON.stringify(c.preconditions || []),
            steps: JSON.stringify(c.steps || []),
            testData: c.testData || null,
            expectedResult: c.expectedResult,
            priority: c.priority || 'medium',
            evidenceStatus: c.evidenceStatus || 'derived',
            evidenceText: c.evidenceText || null,
            source: 'RULE_BASED',
            status: 'PENDING',
          },
        });
        createdCases.push({ ...newCase, preconditions: c.preconditions, steps: c.steps });
      }

      await tx.requirement.update({ where: { id: requirementId }, data: { status: 'GENERATED' } });
      return createdCases;
    });

    return sendSuccess(
      res,
      {
        totalGenerated: created.length,
        method: 'DETERMINISTIC_HEURISTICS',
        executionTimeMs,
        tokensConsumed: 0,
        costUsd: 0,
        rulesMatched,
        testCases: created,
      },
      `Se generaron ${created.length} casos por motor de reglas determinista ISTQB (0 tokens consumidos)`,
      201
    );
  })
);

// POST /api/heuristics/decision-table - Generación por Tabla de Decisión ISTQB (Mejora #11 - Thin Controller)
heuristicsRouter.post(
  '/decision-table',
  asyncHandler(async (req: Request, res: Response) => {
    const { requirementId, clearPrevious } = generateHeuristicSchema.parse(req.body);
    const useCase = new GenerateHeuristicsUseCase();
    const result = await useCase.execute({
      requirementId,
      userId: req.user!.userId,
      userRole: req.user!.role,
      type: 'decision-table',
      clearPrevious,
    });

    return sendSuccess(
      res,
      result,
      `Se generaron ${result.totalGenerated} casos mediante Tabla de Decisión ISTQB`,
      201
    );
  })
);

// POST /api/heuristics/state-transition - Generación por Transición de Estados ISTQB (Mejora #12 - Thin Controller)
heuristicsRouter.post(
  '/state-transition',
  asyncHandler(async (req: Request, res: Response) => {
    const { requirementId, clearPrevious } = generateHeuristicSchema.parse(req.body);
    const useCase = new GenerateHeuristicsUseCase();
    const result = await useCase.execute({
      requirementId,
      userId: req.user!.userId,
      userRole: req.user!.role,
      type: 'state-transition',
      clearPrevious,
    });

    return sendSuccess(
      res,
      result,
      `Se generaron ${result.totalGenerated} casos mediante Transición de Estados ISTQB`,
      201
    );
  })
);

// POST /api/heuristics/analyze-quality - Análisis ISO/IEC/IEEE 29148 de Requisitos (Mejora #15)
heuristicsRouter.post(
  '/analyze-quality',
  asyncHandler(async (req: Request, res: Response) => {
    const schema = z.object({
      requirementId: z.string().uuid().optional(),
      description: z.string().optional(),
      acceptanceCriteria: z.string().optional(),
    });

    const body = schema.parse(req.body);
    let desc = body.description || '';
    let criteria = body.acceptanceCriteria || '';

    if (body.requirementId) {
      const requirement = await assertRequirementAccess(body.requirementId, req.user!.userId, req.user!.role);
      desc = requirement.description;
      criteria = requirement.acceptanceCriteria;
    }

    const report = HeuristicEngine.analyzeRequirementQuality(desc, criteria);

    return sendSuccess(
      res,
      report,
      `Análisis de Calidad ISO 29148 completado (Score: ${report.overallScore}/100 - ${report.rating})`
    );
  })
);

