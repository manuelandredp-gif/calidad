// ==========================================================================
// Application Use Case: GenerateHeuristicsUseCase
// Encapsulates Decision Table, State Transition, and ISTQB Heuristic Derivations
// ==========================================================================

import { prisma } from '../../config/prisma';
import { HeuristicEngine } from '../../core/heuristics/heuristic-engine';
import { SecurityPolicy } from '../../core/domain/security/security-policy';
import { TestCaseMapper, PrismaTestCaseRow } from '../../core/domain/mappers/test-case.mapper';
import { RawGeneratedCase } from '../../core/interfaces/ai-provider.interface';

export interface GenerateHeuristicsInputDTO {
  requirementId: string;
  userId: string;
  userRole: string;
  type: 'decision-table' | 'state-transition' | 'general';
  clearPrevious?: boolean;
}

export class GenerateHeuristicsUseCase {
  public async execute(input: GenerateHeuristicsInputDTO) {
    const { requirementId, userId, userRole, type, clearPrevious = false } = input;

    // 1. Obtención y autorización de dominio
    const requirement = await prisma.requirement.findUnique({
      where: { id: requirementId },
      include: { project: true },
    });

    if (!requirement) {
      throw new Error(`Requisito ${requirementId} no encontrado.`);
    }

    SecurityPolicy.assertProjectAccess(requirement.project.ownerId, { userId, role: userRole });

    const startTime = Date.now();
    let generatedCases: RawGeneratedCase[] = [];
    let method = 'HEURISTIC_ISTQB';
    let extraMeta: Record<string, unknown> = {};

    if (type === 'decision-table') {
      method = 'DECISION_TABLE_ISTQB';
      const dtResult = HeuristicEngine.generateDecisionTable(
        requirement.title,
        requirement.acceptanceCriteria
      );
      generatedCases = dtResult.cases;
      extraMeta = {
        conditions: dtResult.conditions,
        actions: dtResult.actions,
        rules: dtResult.rules,
      };
    } else if (type === 'state-transition') {
      method = 'STATE_TRANSITION_ISTQB';
      const stResult = HeuristicEngine.generateStateTransitions(
        requirement.title,
        `${requirement.description}\n${requirement.acceptanceCriteria}`
      );
      generatedCases = stResult.cases;
      extraMeta = {
        model: stResult.model,
        coverageType: stResult.coverageType,
      };
    } else {
      const fbResult = HeuristicEngine.generateDeterministicTestCases(
        requirement.code,
        requirement.title,
        requirement.description,
        requirement.acceptanceCriteria
      );
      generatedCases = fbResult.cases;
    }

    const executionTimeMs = Date.now() - startTime;

    // 2. Persistencia Transaccional Atómica
    const created = await prisma.$transaction(async (tx) => {
      if (clearPrevious) {
        await tx.testCase.deleteMany({
          where: {
            requirementId,
            status: { in: ['PENDING', 'REJECTED'] },
          },
        });
      }

      const existingCount = await tx.testCase.count({ where: { requirementId } });
      const inserted = [];

      for (let i = 0; i < generatedCases.length; i++) {
        const c = generatedCases[i];
        const prefix = type === 'decision-table' ? 'CP-DT' : type === 'state-transition' ? 'CP-ST' : 'CP-HEUR';
        const code = `${prefix}-${String(existingCount + i + 1).padStart(3, '0')}`;

        const newCase = await tx.testCase.create({
          data: {
            requirementId,
            code,
            type: c.type || 'boundary',
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
        inserted.push(newCase);
      }

      await tx.requirement.update({
        where: { id: requirementId },
        data: { status: 'GENERATED' },
      });

      return inserted;
    });

    return {
      totalGenerated: created.length,
      method,
      executionTimeMs,
      testCases: created.map((c) => TestCaseMapper.toDTO(c as unknown as PrismaTestCaseRow)),
      ...extraMeta,
    };
  }
}
