import { Router, Request, Response } from 'express';
import { prisma } from '../../config/prisma';
import { sendSuccess } from '../../common/utils/api-response';
import { authenticateJWT } from '../../common/middleware/auth.middleware';
import { asyncHandler } from '../../common/middleware/async-handler';
import { assertProjectAccess } from '../../common/utils/ownership';

export const traceabilityRouter = Router();

traceabilityRouter.use(authenticateJWT);

// GET /api/traceability/:projectId - Matriz bidireccional de trazabilidad
traceabilityRouter.get(
  '/:projectId',
  asyncHandler(async (req: Request, res: Response) => {
    const { projectId } = req.params;
    await assertProjectAccess(projectId, req.user!.userId, req.user!.role);

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        requirements: {
          orderBy: { code: 'asc' },
          include: {
            testCases: {
              orderBy: { code: 'asc' },
              select: {
                id: true,
                code: true,
                title: true,
                type: true,
                status: true,
                priority: true,
                evidenceStatus: true,
                evidenceText: true,
              },
            },
          },
        },
      },
    });

    let coveredRequirementsCount = 0;

    const matrix = project!.requirements.map((req) => {
      const approvedCases = req.testCases.filter((tc) => tc.status === 'APPROVED');
      const isCovered = approvedCases.length > 0;
      if (isCovered) coveredRequirementsCount++;

      return {
        requirementId: req.id,
        code: req.code,
        title: req.title,
        status: req.status,
        version: req.version,
        isCovered,
        stats: {
          totalCases: req.testCases.length,
          approved: approvedCases.length,
          pending: req.testCases.filter((tc) => tc.status === 'PENDING').length,
          modified: req.testCases.filter((tc) => tc.status === 'MODIFIED').length,
          rejected: req.testCases.filter((tc) => tc.status === 'REJECTED').length,
        },
        testCases: req.testCases,
      };
    });

    const totalRequirements = project!.requirements.length;
    const coveragePercent =
      totalRequirements > 0
        ? Math.round((coveredRequirementsCount / totalRequirements) * 100)
        : 0;

    return sendSuccess(res, {
      projectId: project!.id,
      projectName: project!.name,
      totalRequirements,
      coveredRequirementsCount,
      coveragePercent,
      matrix,
    });
  })
);
