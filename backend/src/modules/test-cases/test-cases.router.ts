import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/prisma';
import { sendSuccess, sendPaginated, getPagination, buildPaginationMeta } from '../../common/utils/api-response';
import { authenticateJWT } from '../../common/middleware/auth.middleware';
import { asyncHandler } from '../../common/middleware/async-handler';
import { safeJsonArray, safeJsonObject } from '../../common/utils/json';
import { audit } from '../../common/utils/audit';
import {
  assertProjectAccess,
  assertRequirementAccess,
  assertTestCaseAccess,
} from '../../common/utils/ownership';
import { ReviewTestCaseUseCase } from '../../application/use-cases/review-test-case.use-case';
import { PrismaTestCaseRepository } from '../../infrastructure/repositories/prisma-test-case.repository';
import { TestCaseStatus } from '../../core/domain/value-objects/test-case-status.vo';

export const testCasesRouter = Router();

testCasesRouter.use(authenticateJWT);

const reviewSchema = z.object({
  decision: z.enum(['APPROVED', 'MODIFIED', 'REJECTED']),
  comments: z.string().optional(),
  title: z.string().optional(),
  preconditions: z.array(z.string()).optional(),
  steps: z.array(z.string()).optional(),
  testData: z.string().optional().nullable(),
  expectedResult: z.string().optional(),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  evidenceStatus: z.enum(['derived', 'suggested', 'ambiguous', 'conflict']).optional(),
});

const batchReviewSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, 'Debe proporcionar al menos un ID de caso'),
  decision: z.enum(['APPROVED', 'MODIFIED', 'REJECTED']).default('APPROVED'),
  comments: z.string().optional(),
});

// Helper: formatea un caso deserializando sus campos JSON y revisiones.
type ReviewRow = { previousContent: string | null; newContent: string | null; [k: string]: unknown };
function formatCase<T extends { preconditions: string; steps: string; reviews?: ReviewRow[] }>(tc: T) {
  return {
    ...tc,
    preconditions: safeJsonArray(tc.preconditions),
    steps: safeJsonArray(tc.steps),
    reviews: tc.reviews?.map((r) => ({
      ...r,
      previousContent: safeJsonObject(r.previousContent),
      newContent: safeJsonObject(r.newContent),
    })),
  };
}

const reviewsInclude = {
  reviews: {
    orderBy: { createdAt: 'desc' as const },
    include: { reviewer: { select: { id: true, fullName: true, role: true } } },
  },
};

// GET /api/test-cases/project/:projectId - Casos de un proyecto (paginado)
testCasesRouter.get(
  '/project/:projectId',
  asyncHandler(async (req: Request, res: Response) => {
    await assertProjectAccess(req.params.projectId, req.user!.userId, req.user!.role);
    const { page, pageSize, skip, take } = getPagination(req);
    const where = { requirement: { projectId: req.params.projectId } };

    const [total, cases] = await Promise.all([
      prisma.testCase.count({ where }),
      prisma.testCase.findMany({
        where,
        orderBy: { code: 'asc' },
        skip,
        take,
        include: { requirement: { select: { id: true, code: true, title: true } }, ...reviewsInclude },
      }),
    ]);

    return sendPaginated(res, cases.map(formatCase), buildPaginationMeta(page, pageSize, total));
  })
);

// GET /api/test-cases/requirement/:requirementId - Casos de un requisito
testCasesRouter.get(
  '/requirement/:requirementId',
  asyncHandler(async (req: Request, res: Response) => {
    await assertRequirementAccess(req.params.requirementId, req.user!.userId, req.user!.role);
    const cases = await prisma.testCase.findMany({
      where: { requirementId: req.params.requirementId },
      orderBy: { code: 'asc' },
      include: reviewsInclude,
    });
    return sendSuccess(res, cases.map(formatCase));
  })
);

// GET /api/test-cases/:id - Caso individual con trazabilidad
testCasesRouter.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    await assertTestCaseAccess(req.params.id, req.user!.userId, req.user!.role);
    const testCase = await prisma.testCase.findUnique({
      where: { id: req.params.id },
      include: {
        requirement: { select: { id: true, code: true, title: true, projectId: true } },
        ...reviewsInclude,
      },
    });
    return sendSuccess(res, formatCase(testCase!));
  })
);

// PATCH /api/test-cases/batch-review - Revisión masiva (Thin Controller)
testCasesRouter.patch(
  '/batch-review',
  asyncHandler(async (req: Request, res: Response) => {
    const { ids, decision, comments } = batchReviewSchema.parse(req.body);
    const repo = new PrismaTestCaseRepository();
    const result = await repo.batchReview(
      ids,
      TestCaseStatus.from(decision),
      req.user!.userId,
      comments
    );

    return sendSuccess(res, { count: result.affected }, `Se actualizaron ${result.affected} casos a '${decision}'`);
  })
);

// PATCH /api/test-cases/:id/review - Revisión humana individual (Thin Controller)
testCasesRouter.patch(
  '/:id/review',
  asyncHandler(async (req: Request, res: Response) => {
    await assertTestCaseAccess(req.params.id, req.user!.userId, req.user!.role);
    const { decision, comments, ...updatedFields } = reviewSchema.parse(req.body);

    const useCase = new ReviewTestCaseUseCase();
    const updated = await useCase.execute({
      testCaseId: req.params.id,
      reviewerId: req.user!.userId,
      reviewerRole: req.user!.role,
      decision,
      comments,
      updates: updatedFields,
    });

    return sendSuccess(res, { testCase: updated }, `Caso de prueba marcado como '${decision}'`);
  })
);

// DELETE /api/test-cases/:id
testCasesRouter.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    await assertTestCaseAccess(req.params.id, req.user!.userId, req.user!.role);
    await prisma.testCase.delete({ where: { id: req.params.id } });
    audit(req, 'TESTCASE_DELETED', { testCaseId: req.params.id });
    return sendSuccess(res, null, 'Caso de prueba eliminado');
  })
);

const createManualCaseSchema = z.object({
  requirementId: z.string().uuid('ID de requisito inválido'),
  type: z.enum(['positive', 'negative', 'alternative', 'boundary', 'validation']),
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
  preconditions: z.array(z.string()).optional().default([]),
  steps: z.array(z.string()).min(1, 'Debe incluir al menos un paso de ejecución'),
  testData: z.string().optional().nullable(),
  expectedResult: z.string().min(3, 'El resultado esperado es requerido'),
  priority: z.enum(['high', 'medium', 'low']).optional().default('medium'),
  evidenceStatus: z.enum(['derived', 'suggested', 'ambiguous', 'conflict']).optional().default('derived'),
  evidenceText: z.string().optional().nullable(),
  status: z.enum(['PENDING', 'APPROVED']).optional().default('APPROVED'),
});

const updateManualCaseSchema = z.object({
  type: z.enum(['positive', 'negative', 'alternative', 'boundary', 'validation']).optional(),
  title: z.string().min(3).optional(),
  preconditions: z.array(z.string()).optional(),
  steps: z.array(z.string()).optional(),
  testData: z.string().optional().nullable(),
  expectedResult: z.string().optional(),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  evidenceStatus: z.enum(['derived', 'suggested', 'ambiguous', 'conflict']).optional(),
  evidenceText: z.string().optional().nullable(),
  status: z.enum(['PENDING', 'APPROVED', 'MODIFIED', 'REJECTED']).optional(),
});

// POST /api/test-cases - Creación manual
testCasesRouter.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const data = createManualCaseSchema.parse(req.body);
    await assertRequirementAccess(data.requirementId, req.user!.userId, req.user!.role);

    const existingCount = await prisma.testCase.count({ where: { requirementId: data.requirementId } });
    const code = `CP-${String(existingCount + 1).padStart(3, '0')}`;

    const newCase = await prisma.testCase.create({
      data: {
        requirementId: data.requirementId,
        code,
        type: data.type,
        title: data.title,
        preconditions: JSON.stringify(data.preconditions),
        steps: JSON.stringify(data.steps),
        testData: data.testData || null,
        expectedResult: data.expectedResult,
        priority: data.priority,
        evidenceStatus: data.evidenceStatus,
        evidenceText: data.evidenceText || null,
        source: 'MANUAL',
        status: data.status,
      },
    });

    return sendSuccess(
      res,
      { ...newCase, preconditions: data.preconditions, steps: data.steps },
      'Caso de prueba creado manualmente con éxito (origen: MANUAL)',
      201
    );
  })
);

// PUT /api/test-cases/:id - Edición integral manual
testCasesRouter.put(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    await assertTestCaseAccess(req.params.id, req.user!.userId, req.user!.role);
    const data = updateManualCaseSchema.parse(req.body);

    const updateData: Record<string, unknown> = {};
    if (data.type) updateData.type = data.type;
    if (data.title) updateData.title = data.title;
    if (data.preconditions) updateData.preconditions = JSON.stringify(data.preconditions);
    if (data.steps) updateData.steps = JSON.stringify(data.steps);
    if (data.testData !== undefined) updateData.testData = data.testData;
    if (data.expectedResult) updateData.expectedResult = data.expectedResult;
    if (data.priority) updateData.priority = data.priority;
    if (data.evidenceStatus) updateData.evidenceStatus = data.evidenceStatus;
    if (data.evidenceText !== undefined) updateData.evidenceText = data.evidenceText;
    if (data.status) updateData.status = data.status;

    const updated = await prisma.testCase.update({ where: { id: req.params.id }, data: updateData });
    return sendSuccess(
      res,
      { ...updated, preconditions: JSON.parse(updated.preconditions || '[]'), steps: JSON.parse(updated.steps || '[]') },
      'Caso de prueba actualizado con éxito'
    );
  })
);

// POST /api/test-cases/:id/clone - Clonación rápida
testCasesRouter.post(
  '/:id/clone',
  asyncHandler(async (req: Request, res: Response) => {
    const original = await assertTestCaseAccess(req.params.id, req.user!.userId, req.user!.role);

    const existingCount = await prisma.testCase.count({ where: { requirementId: original.requirementId } });
    const code = `CP-${String(existingCount + 1).padStart(3, '0')}`;

    const cloned = await prisma.testCase.create({
      data: {
        requirementId: original.requirementId,
        code,
        type: original.type,
        title: `[Copia] ${original.title}`,
        preconditions: original.preconditions,
        steps: original.steps,
        testData: original.testData,
        expectedResult: original.expectedResult,
        priority: original.priority,
        evidenceStatus: original.evidenceStatus,
        evidenceText: original.evidenceText,
        source: 'MANUAL',
        status: 'PENDING',
      },
    });

    return sendSuccess(
      res,
      { ...cloned, preconditions: JSON.parse(cloned.preconditions || '[]'), steps: JSON.parse(cloned.steps || '[]') },
      `Caso clonado como ${code} para diseño manual de variantes`,
      201
    );
  })
);
