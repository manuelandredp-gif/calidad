import { Router, Request, Response } from 'express';
import { prisma } from '../../config/prisma';
import { sendSuccess } from '../../common/utils/api-response';
import { authenticateJWT } from '../../common/middleware/auth.middleware';
import { asyncHandler } from '../../common/middleware/async-handler';
import { assertProjectAccess } from '../../common/utils/ownership';
import { buildCsv, buildMarkdown, buildJson, safeFilename } from './export.service';
import { CodeGenerators } from './code-generators';

export const exportRouter = Router();

exportRouter.use(authenticateJWT);

// GET /api/export/:projectId - Exportación multiformato (JSON, CSV, Markdown, Playwright, Cypress, Gherkin, Postman)
exportRouter.get(
  '/:projectId',
  asyncHandler(async (req: Request, res: Response) => {
    const { projectId } = req.params;
    const format = (req.query.format as string) || 'json';
    const onlyApproved = req.query.onlyApproved === 'true';

    await assertProjectAccess(projectId, req.user!.userId, req.user!.role);

    const project = (await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        requirements: {
          orderBy: { code: 'asc' },
          include: {
            testCases: {
              where: onlyApproved ? { status: 'APPROVED' } : undefined,
              orderBy: { code: 'asc' },
            },
          },
        },
      },
    }))!;

    const filename = safeFilename(project.name);

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="testgenai_${filename}.csv"`);
      return res.status(200).send(buildCsv(project));
    }

    if (format === 'markdown') {
      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="testgenai_${filename}.md"`);
      return res.status(200).send(buildMarkdown(project, onlyApproved));
    }

    if (format === 'playwright') {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="testgenai_${filename}.spec.ts"`);
      return res.status(200).send(CodeGenerators.buildPlaywright(project, onlyApproved));
    }

    if (format === 'cypress') {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="testgenai_${filename}.cy.ts"`);
      return res.status(200).send(CodeGenerators.buildCypress(project, onlyApproved));
    }

    if (format === 'gherkin') {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="testgenai_${filename}.feature"`);
      return res.status(200).send(CodeGenerators.buildGherkin(project, onlyApproved));
    }

    if (format === 'postman') {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="testgenai_${filename}.postman_collection.json"`);
      return res.status(200).json(CodeGenerators.buildPostmanCollection(project, onlyApproved));
    }

    return sendSuccess(res, buildJson(project));
  })
);

