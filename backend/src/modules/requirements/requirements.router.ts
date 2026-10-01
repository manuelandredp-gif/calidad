import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/prisma';
import { sendSuccess, sendPaginated, getPagination, buildPaginationMeta } from '../../common/utils/api-response';
import { authenticateJWT } from '../../common/middleware/auth.middleware';
import { asyncHandler } from '../../common/middleware/async-handler';
import { ApiError } from '../../common/errors/api-error';
import { assertProjectAccess, assertRequirementAccess } from '../../common/utils/ownership';
import { safeJsonArray } from '../../common/utils/json';
import { audit } from '../../common/utils/audit';

export const requirementsRouter = Router();

requirementsRouter.use(authenticateJWT);

const createRequirementSchema = z.object({
  projectId: z.string().uuid('ID de proyecto inválido'),
  code: z.string().min(2, 'Código requerido (ej. REQ-001)'),
  title: z.string().min(3, 'Título debe tener al menos 3 caracteres'),
  description: z.string().min(5, 'La descripción es requerida'),
  acceptanceCriteria: z.string().min(5, 'Los criterios de aceptación son requeridos'),
});

const updateRequirementSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(5).optional(),
  acceptanceCriteria: z.string().min(5).optional(),
  status: z.enum(['DRAFT', 'READY_FOR_AI', 'GENERATED', 'OBSOLETE']).optional(),
  expectedVersion: z.number().int().positive().optional(),
});

const importBatchSchema = z.object({
  projectId: z.string().uuid(),
  requirements: z
    .array(
      z.object({
        code: z.string(),
        title: z.string(),
        description: z.string(),
        acceptanceCriteria: z.string(),
      })
    )
    .min(1, 'Debe incluir al menos un requisito para importar'),
});

// GET /api/requirements/project/:projectId - Requisitos de un proyecto (paginado)
requirementsRouter.get(
  '/project/:projectId',
  asyncHandler(async (req: Request, res: Response) => {
    await assertProjectAccess(req.params.projectId, req.user!.userId, req.user!.role);
    const { page, pageSize, skip, take } = getPagination(req);

    const where = { projectId: req.params.projectId };
    const [total, requirements] = await Promise.all([
      prisma.requirement.count({ where }),
      prisma.requirement.findMany({
        where,
        orderBy: { code: 'asc' },
        skip,
        take,
        include: { _count: { select: { testCases: true, aiGenerations: true } } },
      }),
    ]);

    return sendPaginated(res, requirements, buildPaginationMeta(page, pageSize, total));
  })
);

// GET /api/requirements/:id - Detalle de un requisito con sus casos de prueba
requirementsRouter.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    await assertRequirementAccess(req.params.id, req.user!.userId, req.user!.role);
    const requirement = await prisma.requirement.findUnique({
      where: { id: req.params.id },
      include: {
        testCases: { orderBy: { code: 'asc' } },
        aiGenerations: { orderBy: { createdAt: 'desc' } },
      },
    });

    const formatted = {
      ...requirement!,
      testCases: requirement!.testCases.map((tc) => ({
        ...tc,
        preconditions: safeJsonArray(tc.preconditions),
        steps: safeJsonArray(tc.steps),
      })),
    };
    return sendSuccess(res, formatted);
  })
);

// POST /api/requirements - Crear nuevo requisito
requirementsRouter.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { projectId, code, title, description, acceptanceCriteria } = createRequirementSchema.parse(req.body);
    await assertProjectAccess(projectId, req.user!.userId, req.user!.role);

    const existing = await prisma.requirement.findUnique({
      where: { projectId_code: { projectId, code } },
    });
    if (existing) throw ApiError.conflict(`Ya existe un requisito con el código '${code}' en este proyecto`);

    const requirement = await prisma.requirement.create({
      data: { projectId, code, title, description, acceptanceCriteria, status: 'READY_FOR_AI' },
    });
    return sendSuccess(res, requirement, 'Requisito creado con éxito', 201);
  })
);

// PUT /api/requirements/:id - Actualizar requisito (versionado + concurrencia optimista)
requirementsRouter.put(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const current = await assertRequirementAccess(req.params.id, req.user!.userId, req.user!.role);
    const parsedData = updateRequirementSchema.parse(req.body);

    // Control de Concurrencia Optimista: previene sobreescritura accidental
    if (parsedData.expectedVersion !== undefined && current.version !== parsedData.expectedVersion) {
      throw ApiError.conflict(
        `Conflicto de concurrencia: el requisito fue modificado por otro usuario (versión actual: ${current.version}, versión enviada: ${parsedData.expectedVersion}). Recargue antes de guardar.`
      );
    }

    const hasContentChanged =
      (parsedData.description && parsedData.description !== current.description) ||
      (parsedData.acceptanceCriteria && parsedData.acceptanceCriteria !== current.acceptanceCriteria);

    const newVersion = hasContentChanged ? current.version + 1 : current.version;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { expectedVersion, ...dataToUpdate } = parsedData;

    const updated = await prisma.requirement.update({
      where: { id: req.params.id },
      data: { ...dataToUpdate, version: newVersion },
    });
    return sendSuccess(res, updated, 'Requisito actualizado correctamente');
  })
);

// DELETE /api/requirements/:id - Eliminar requisito
requirementsRouter.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    await assertRequirementAccess(req.params.id, req.user!.userId, req.user!.role);
    await prisma.requirement.delete({ where: { id: req.params.id } });
    audit(req, 'REQUIREMENT_DELETED', { requirementId: req.params.id });
    return sendSuccess(res, null, 'Requisito eliminado con éxito');
  })
);

// POST /api/requirements/import - Importación por lotes
requirementsRouter.post(
  '/import',
  asyncHandler(async (req: Request, res: Response) => {
    const { projectId, requirements } = importBatchSchema.parse(req.body);
    await assertProjectAccess(projectId, req.user!.userId, req.user!.role);

    const created = await prisma.$transaction(
      requirements.map((r) =>
        prisma.requirement.upsert({
          where: { projectId_code: { projectId, code: r.code } },
          update: { title: r.title, description: r.description, acceptanceCriteria: r.acceptanceCriteria },
          create: {
            projectId,
            code: r.code,
            title: r.title,
            description: r.description,
            acceptanceCriteria: r.acceptanceCriteria,
            status: 'READY_FOR_AI',
          },
        })
      )
    );
    return sendSuccess(res, created, `Se importaron ${created.length} requisitos exitosamente`, 201);
  })
);
