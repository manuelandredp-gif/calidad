// ==========================================================================
// Application Use Case: ReviewTestCaseUseCase
// Encapsulates Human-in-the-Loop Reviews, Optimistic Locking & Audit Snapshots
// ==========================================================================

import { prisma } from '../../config/prisma';
import { logger } from '../../common/utils/logger';
import { SecurityPolicy } from '../../core/domain/security/security-policy';
import { TestCaseMapper, PrismaTestCaseRow } from '../../core/domain/mappers/test-case.mapper';

export interface ReviewTestCaseInputDTO {
  testCaseId: string;
  reviewerId: string;
  reviewerRole: string;
  decision: 'APPROVED' | 'MODIFIED' | 'REJECTED';
  comments?: string;
  expectedVersion?: number;
  updates?: {
    title?: string;
    preconditions?: string[];
    steps?: string[];
    testData?: string | null;
    expectedResult?: string;
    priority?: string;
  };
}

export class ReviewTestCaseUseCase {
  public async execute(input: ReviewTestCaseInputDTO) {
    const { testCaseId, reviewerId, reviewerRole, decision, comments, expectedVersion, updates } = input;

    // 1. Autorización de auditoría
    SecurityPolicy.assertCanReview({ userId: reviewerId, role: reviewerRole });

    // 2. Obtener caso con requisito para comprobar pertenencia de proyecto
    const currentCase = await prisma.testCase.findUnique({
      where: { id: testCaseId },
      include: {
        requirement: { include: { project: true } },
        reviews: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    if (!currentCase) {
      throw new Error(`Caso de prueba con ID ${testCaseId} no encontrado.`);
    }

    SecurityPolicy.assertProjectAccess(
      currentCase.requirement.project.ownerId,
      { userId: reviewerId, role: reviewerRole }
    );

    // 3. Convertir a entidad de dominio para ejecutar invariantes
    const entity = TestCaseMapper.toDomain(currentCase as unknown as PrismaTestCaseRow);

    // Verificación de bloqueo optimista
    entity.assertVersionMatch(expectedVersion);

    const previousSnapshot = {
      title: entity.title,
      status: entity.status.getValue(),
      preconditions: entity.preconditions,
      steps: entity.steps,
      expectedResult: entity.expectedResult,
      priority: entity.priority.getLevel(),
    };

    if (decision === 'APPROVED') {
      entity.approve(reviewerId, comments);
    } else if (decision === 'REJECTED') {
      entity.reject(reviewerId, comments || 'Rechazado por auditor');
    } else if (decision === 'MODIFIED') {
      entity.modify({
        title: updates?.title,
        steps: updates?.steps,
        expectedResult: updates?.expectedResult,
        preconditions: updates?.preconditions,
        testData: updates?.testData,
      });
    }

    const newSnapshot = {
      title: entity.title,
      status: entity.status.getValue(),
      preconditions: entity.preconditions,
      steps: entity.steps,
      expectedResult: entity.expectedResult,
      priority: entity.priority.getLevel(),
    };

    // 4. Persistencia Transaccional Atómica
    const updated = await prisma.$transaction(async (tx) => {
      const persisted = await tx.testCase.update({
        where: { id: testCaseId },
        data: {
          title: entity.title,
          status: entity.status.getValue(),
          preconditions: JSON.stringify(entity.preconditions),
          steps: JSON.stringify(entity.steps),
          testData: entity.testData,
          expectedResult: entity.expectedResult,
          updatedAt: new Date(),
        },
        include: {
          requirement: { select: { id: true, code: true, title: true } },
          reviews: {
            orderBy: { createdAt: 'desc' },
            include: { reviewer: { select: { id: true, fullName: true, role: true } } },
          },
        },
      });

      await tx.testCaseReview.create({
        data: {
          testCaseId,
          reviewerId,
          decision,
          comments: comments || null,
          previousContent: JSON.stringify(previousSnapshot),
          newContent: JSON.stringify(newSnapshot),
        },
      });

      return persisted;
    });

    // 5. Rastro de Auditoría
    logger.info(
      {
        action: `TEST_CASE_${decision}`,
        entity: 'TestCase',
        entityId: testCaseId,
        userId: reviewerId,
        details: { decision, comments },
      },
      `[Audit] TEST_CASE_${decision}`
    );

    return TestCaseMapper.toDTO(updated as unknown as PrismaTestCaseRow);
  }
}
