// ==========================================================================
// Application Use Case: GetProjectsWithMetricsUseCase
// Optimized Aggregations, Pagination & Role-Based Scope
// ==========================================================================

import { prisma } from '../../config/prisma';

export interface GetProjectsInputDTO {
  userId: string;
  userRole: string;
  skip: number;
  take: number;
}

export interface ProjectStatsDTO {
  requirementsCount: number;
  totalTestCases: number;
  approvedTestCases: number;
  coveragePercent: number;
  totalCostUsd: number;
}

export interface ProjectDTO {
  id: string;
  name: string;
  description: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  stats: ProjectStatsDTO;
}

export interface GetProjectsOutputDTO {
  items: ProjectDTO[];
  total: number;
}

export class GetProjectsWithMetricsUseCase {
  public async execute(input: GetProjectsInputDTO): Promise<GetProjectsOutputDTO> {
    const { userId, userRole, skip, take } = input;
    const ownerFilter = userRole === 'ADMIN' ? {} : { ownerId: userId };

    const [total, projects] = await Promise.all([
      prisma.project.count({ where: ownerFilter }),
      prisma.project.findMany({
        where: ownerFilter,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          requirements: {
            select: {
              id: true,
              testCases: { select: { status: true } },
              aiGenerations: { select: { estimatedCost: true } },
            },
          },
        },
      }),
    ]);

    const items: ProjectDTO[] = projects.map((p) => {
      const requirementsCount = p.requirements.length;
      let totalTestCases = 0;
      let approvedTestCases = 0;
      let totalCostUsd = 0;
      let reqsWithApproved = 0;

      for (let i = 0; i < p.requirements.length; i++) {
        const r = p.requirements[i];
        totalTestCases += r.testCases.length;
        let hasApprovedInReq = false;

        for (let j = 0; j < r.testCases.length; j++) {
          if (r.testCases[j].status === 'APPROVED') {
            approvedTestCases++;
            hasApprovedInReq = true;
          }
        }
        if (hasApprovedInReq) reqsWithApproved++;

        for (let k = 0; k < r.aiGenerations.length; k++) {
          totalCostUsd += r.aiGenerations[k].estimatedCost;
        }
      }

      const coverage =
        requirementsCount > 0
          ? Math.round((reqsWithApproved / requirementsCount) * 100)
          : 0;

      return {
        id: p.id,
        name: p.name,
        description: p.description,
        status: p.status,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        stats: {
          requirementsCount,
          totalTestCases,
          approvedTestCases,
          coveragePercent: coverage,
          totalCostUsd: Math.round(totalCostUsd * 10000) / 10000,
        },
      };
    });

    return { items, total };
  }
}
