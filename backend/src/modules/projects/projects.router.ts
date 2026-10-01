import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/prisma';
import { sendSuccess, sendPaginated, getPagination, buildPaginationMeta } from '../../common/utils/api-response';
import { authenticateJWT } from '../../common/middleware/auth.middleware';
import { asyncHandler } from '../../common/middleware/async-handler';
import { assertProjectAccess } from '../../common/utils/ownership';
import { audit } from '../../common/utils/audit';
import { GetProjectsWithMetricsUseCase } from '../../application/use-cases/get-projects-with-metrics.use-case';

export const projectsRouter = Router();

projectsRouter.use(authenticateJWT);

const createProjectSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  description: z.string().optional(),
});

const updateProjectSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
});

// GET /api/projects - Lista SOLO los proyectos del usuario, paginados, con métricas consolidadas (Thin Controller)
projectsRouter.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { page, pageSize, skip, take } = getPagination(req);
    const useCase = new GetProjectsWithMetricsUseCase();
    const { items, total } = await useCase.execute({
      userId: req.user!.userId,
      userRole: req.user!.role,
      skip,
      take,
    });

    return sendPaginated(res, items, buildPaginationMeta(page, pageSize, total));
  })
);

// POST /api/projects - Crea un nuevo proyecto (propiedad del usuario autenticado)
projectsRouter.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const data = createProjectSchema.parse(req.body);
    const project = await prisma.project.create({
      data: { name: data.name, description: data.description, ownerId: req.user!.userId },
    });
    audit(req, 'PROJECT_CREATED', { projectId: project.id, name: project.name });
    return sendSuccess(res, project, 'Proyecto creado con éxito', 201);
  })
);

// GET /api/projects/:id - Detalle (solo si pertenece al usuario)
projectsRouter.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    await assertProjectAccess(req.params.id, req.user!.userId, req.user!.role);
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        requirements: {
          orderBy: { code: 'asc' },
          include: { _count: { select: { testCases: true, aiGenerations: true } } },
        },
      },
    });
    return sendSuccess(res, project);
  })
);

// PUT /api/projects/:id - Actualiza (solo propietario)
projectsRouter.put(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    await assertProjectAccess(req.params.id, req.user!.userId, req.user!.role);
    const data = updateProjectSchema.parse(req.body);
    const project = await prisma.project.update({ where: { id: req.params.id }, data });
    return sendSuccess(res, project, 'Proyecto actualizado con éxito');
  })
);

// DELETE /api/projects/:id - Elimina (solo propietario)
projectsRouter.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    await assertProjectAccess(req.params.id, req.user!.userId, req.user!.role);
    await prisma.project.delete({ where: { id: req.params.id } });
    audit(req, 'PROJECT_DELETED', { projectId: req.params.id });
    return sendSuccess(res, null, 'Proyecto eliminado correctamente');
  })
);
