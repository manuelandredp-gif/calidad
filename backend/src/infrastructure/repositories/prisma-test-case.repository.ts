// ==========================================================================
// Infrastructure: PrismaTestCaseRepository
// Implements ITestCaseRepository with Atomic Transactions & Clean Mapping
// ==========================================================================

import { prisma } from '../../config/prisma';
import {
  ITestCaseRepository,
  PaginationOptions,
  PaginatedResult,
} from '../../core/ports/test-case-repository.port';
import { TestCaseEntity } from '../../core/domain/entities/test-case.entity';
import { TestCaseMapper, PrismaTestCaseRow } from '../../core/domain/mappers/test-case.mapper';
import { TestCaseStatus } from '../../core/domain/value-objects/test-case-status.vo';

export class PrismaTestCaseRepository implements ITestCaseRepository {
  private readonly reviewsInclude = {
    reviews: {
      orderBy: { createdAt: 'desc' as const },
      include: { reviewer: { select: { id: true, fullName: true, role: true } } },
    },
  };

  public async findById(id: string): Promise<TestCaseEntity | null> {
    const row = await prisma.testCase.findUnique({
      where: { id },
      include: this.reviewsInclude,
    });
    if (!row) return null;
    return TestCaseMapper.toDomain(row as PrismaTestCaseRow);
  }

  public async findByRequirementId(requirementId: string): Promise<TestCaseEntity[]> {
    const rows = await prisma.testCase.findMany({
      where: { requirementId },
      orderBy: { code: 'asc' },
      include: this.reviewsInclude,
    });
    return rows.map((r) => TestCaseMapper.toDomain(r as PrismaTestCaseRow));
  }

  public async findByProjectId(
    projectId: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<TestCaseEntity>> {
    const where = { requirement: { projectId } };
    const skip = options?.skip ?? 0;
    const take = options?.take ?? 50;

    const [total, rows] = await Promise.all([
      prisma.testCase.count({ where }),
      prisma.testCase.findMany({
        where,
        orderBy: { code: 'asc' },
        skip,
        take,
        include: {
          requirement: { select: { id: true, code: true, title: true } },
          ...this.reviewsInclude,
        },
      }),
    ]);

    return {
      items: rows.map((r) => TestCaseMapper.toDomain(r as PrismaTestCaseRow)),
      total,
    };
  }

  public async save(testCase: TestCaseEntity): Promise<void> {
    const data = TestCaseMapper.toPersistence(testCase);
    await prisma.testCase.upsert({
      where: { id: testCase.id },
      create: data,
      update: data,
    });
  }

  public async saveBatch(testCases: TestCaseEntity[]): Promise<void> {
    if (testCases.length === 0) return;

    // Ejecución transaccional atómica (ACID)
    await prisma.$transaction(
      testCases.map((tc) => {
        const data = TestCaseMapper.toPersistence(tc);
        return prisma.testCase.upsert({
          where: { id: tc.id },
          create: data,
          update: data,
        });
      })
    );
  }

  public async batchReview(
    ids: string[],
    decision: TestCaseStatus,
    reviewerId: string,
    comments?: string
  ): Promise<{ affected: number }> {
    if (ids.length === 0) return { affected: 0 };

    // Transacción atómica: actualiza los casos e inserta logs de revisión en un único commit
    return await prisma.$transaction(async (tx) => {
      // 1. Obtener casos existentes para capturar snapshots de auditoría
      const currentCases = await tx.testCase.findMany({
        where: { id: { in: ids } },
      });

      // 2. Actualizar estado
      const updateResult = await tx.testCase.updateMany({
        where: { id: { in: ids } },
        data: {
          status: decision.getValue(),
          updatedAt: new Date(),
        },
      });

      // 3. Crear registros de revisión de auditoría
      if (currentCases.length > 0) {
        await tx.testCaseReview.createMany({
          data: currentCases.map((c) => ({
            testCaseId: c.id,
            reviewerId,
            decision: decision.getValue(),
            comments: comments || `Revisión por lotes (${decision.getValue()})`,
            previousContent: JSON.stringify({
              title: c.title,
              status: c.status,
              steps: c.steps,
              expectedResult: c.expectedResult,
            }),
            newContent: JSON.stringify({
              title: c.title,
              status: decision.getValue(),
              steps: c.steps,
              expectedResult: c.expectedResult,
            }),
          })),
        });
      }

      return { affected: updateResult.count };
    });
  }

  public async delete(id: string): Promise<boolean> {
    try {
      await prisma.testCase.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  public async deleteUnapprovedByRequirement(requirementId: string): Promise<number> {
    const res = await prisma.testCase.deleteMany({
      where: {
        requirementId,
        status: { in: ['PENDING', 'REJECTED'] },
      },
    });
    return res.count;
  }
}
