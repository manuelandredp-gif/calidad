import { Router, Request, Response } from 'express';
import { prisma } from '../../config/prisma';
import { authenticateJWT } from '../../common/middleware/auth.middleware';
import { asyncHandler } from '../../common/middleware/async-handler';
import { assertProjectAccess } from '../../common/utils/ownership';
import { ApiError } from '../../common/errors/api-error';
import { buildCsv, buildMarkdown, buildJson, safeFilename } from './export.service';

export const exportRouter = Router();

exportRouter.use(authenticateJWT);

// GET /api/v1/export/:projectId?format=csv|json|markdown
exportRouter.get(
  '/:projectId',
  asyncHandler(async (req: Request, res: Response) => {
    const { projectId } = req.params;
    const format = ((req.query.format as string) || 'json').toLowerCase();

    if (!['csv', 'json', 'markdown'].includes(format)) {
      throw ApiError.badRequest(
        `Formato '${format}' no soportado. Los formatos permitidos son: csv, json, markdown.`
      );
    }

    await assertProjectAccess(projectId, req.user!.userId, req.user!.role);

    // Exportar únicamente requisitos activos y casos APROBADOS vigentes (RF-11)
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        requirements: {
          where: { status: { not: 'OBSOLETE' } },
          orderBy: { code: 'asc' },
          include: {
            testCases: {
              where: {
                status: 'APPROVED',
                isObsolete: false,
              },
              orderBy: { code: 'asc' },
            },
          },
        },
      },
    });

    if (!project) {
      throw ApiError.notFound('Proyecto no encontrado.');
    }

    const totalApprovedCases = project.requirements.reduce(
      (acc, r) => acc + r.testCases.length,
      0
    );

    if (totalApprovedCases === 0) {
      throw ApiError.badRequest(
        'No hay casos de prueba aprobados vigentes para exportar. Revise y apruebe casos antes de generar el documento oficial.'
      );
    }

    const filename = safeFilename(project.name);

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="testgenai_${filename}.csv"`);
      return res.status(200).send('\uFEFF' + buildCsv(project));
    }

    if (format === 'markdown') {
      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="testgenai_${filename}.md"`);
      return res.status(200).send(buildMarkdown(project));
    }

    // Default JSON
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="testgenai_${filename}.json"`);
    return res.status(200).json(buildJson(project));
  })
);
