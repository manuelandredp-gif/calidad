// ==========================================================================
// Application Use Case: GenerateTestCasesUseCase
// Core Business Orchestration: AI Derivation, Caching, PII Masking & Persistence
// ==========================================================================

import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import { logger } from '../../common/utils/logger';
import { AIFactory } from '../../core/ai.factory';
import { HeuristicEngine } from '../../core/heuristics/heuristic-engine';
import { AIGenerationResult, RawGeneratedCase } from '../../core/interfaces/ai-provider.interface';
import { PromptGuard } from '../../common/security/prompt-guard';
import { PIIMasker } from '../../common/security/pii-masker';
import { RequirementFingerprintService } from '../../core/domain/services/requirement-fingerprint.service';
import { SecurityPolicy } from '../../core/domain/security/security-policy';
import { TestCaseMapper, PrismaTestCaseRow } from '../../core/domain/mappers/test-case.mapper';

export interface GenerateTestCasesInputDTO {
  requirementId: string;
  userId: string;
  userRole: string;
  provider?: string;
  model?: string;
  temperature?: number;
  clearPreviousUnapproved?: boolean;
  useCache?: boolean;
}

export interface GenerateTestCasesOutputDTO {
  cases: Array<Record<string, unknown>>;
  generation: {
    provider: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    estimatedCost: number;
    responseTimeMs: number;
    cached: boolean;
  };
}

export class GenerateTestCasesUseCase {
  public async execute(input: GenerateTestCasesInputDTO): Promise<GenerateTestCasesOutputDTO> {
    const {
      requirementId,
      userId,
      userRole,
      provider,
      model,
      temperature,
      clearPreviousUnapproved = false,
      useCache = true,
    } = input;

    // 1. Autorización & obtención del requisito
    const requirement = await prisma.requirement.findUnique({
      where: { id: requirementId },
      include: { project: true },
    });

    if (!requirement) {
      throw new Error(`Requisito con ID ${requirementId} no encontrado.`);
    }

    // Validación de seguridad de dominio
    SecurityPolicy.assertProjectAccess(requirement.project.ownerId, { userId, role: userRole });

    const selectedProvider = (provider || env.AI_PROVIDER_DEFAULT || 'mock').toLowerCase();
    const selectedModel = model || 'default';

    // 2. Cálculo de Fingerprint determinista (Deduplicación)
    const inputHash = RequirementFingerprintService.compute({
      code: requirement.code,
      title: requirement.title,
      description: requirement.description,
      acceptanceCriteria: requirement.acceptanceCriteria,
      provider: selectedProvider,
      model: selectedModel,
    });

    // 3. CACHÉ: Reutilización de generación idéntica previa si está habilitado
    if (useCache) {
      const cached = await prisma.aiGeneration.findFirst({
        where: { requirementId, inputHash },
        orderBy: { createdAt: 'desc' },
      });

      if (cached) {
        const existingCases = await prisma.testCase.findMany({
          where: { requirementId, source: 'AI_GENERATED' },
          orderBy: { code: 'asc' },
          include: {
            reviews: {
              orderBy: { createdAt: 'desc' },
              include: { reviewer: { select: { id: true, fullName: true, role: true } } },
            },
          },
        });

        if (existingCases.length > 0) {
          logger.info(`[GenerateTestCasesUseCase] Reutilizando ${existingCases.length} casos en caché (Hash: ${inputHash.substring(0, 8)}...)`);
          return {
            cases: existingCases.map((tc) => TestCaseMapper.toDTO(tc as unknown as PrismaTestCaseRow)),
            generation: {
              provider: cached.provider,
              model: cached.model,
              inputTokens: 0,
              outputTokens: 0,
              estimatedCost: 0,
              responseTimeMs: cached.responseTimeMs,
              cached: true,
            },
          };
        }
      }
    }

    // 4. Guardrails de Seguridad: Anti-Prompt Injection & Anonimización PII
    PromptGuard.assertSafe(requirement.description);
    PromptGuard.assertSafe(requirement.acceptanceCriteria);

    const descMask = PIIMasker.mask(requirement.description);
    const critMask = PIIMasker.mask(requirement.acceptanceCriteria);

    if (descMask.totalMasked > 0 || critMask.totalMasked > 0) {
      logger.info(`[GenerateTestCasesUseCase] PII detectado y enmascarado (${descMask.totalMasked + critMask.totalMasked} tokens anonimizados).`);
    }

    // 5. Orquestación del Proveedor de IA (Strategy Registry)
    const aiProvider = AIFactory.getProvider(selectedProvider);
    const startTime = Date.now();
    let result: AIGenerationResult;

    try {
      result = await aiProvider.generateTestCases(
        requirement.code,
        requirement.title,
        descMask.maskedText,
        critMask.maskedText,
        {
          model: selectedModel !== 'default' ? selectedModel : undefined,
          temperature,
        }
      );

      // Si se enmascaró PII, restaurar los valores en los casos generados
      if (descMask.piiFound || critMask.piiFound) {
        const combinedMaskMap = new Map([...descMask.maskMap, ...critMask.maskMap]);
        result.cases = result.cases.map((c) => ({
          ...c,
          title: PIIMasker.unmask(c.title, combinedMaskMap),
          expectedResult: PIIMasker.unmask(c.expectedResult, combinedMaskMap),
          preconditions: (c.preconditions || []).map((p) => PIIMasker.unmask(p, combinedMaskMap)),
          steps: (c.steps || []).map((s) => PIIMasker.unmask(s, combinedMaskMap)),
          testData: c.testData ? PIIMasker.unmask(c.testData, combinedMaskMap) : c.testData,
        }));
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logger.warn(`[GenerateTestCasesUseCase] Proveedor '${selectedProvider}' falló. Activando fallback heurístico determinista: ${errorMsg}`);
      const { cases } = HeuristicEngine.generateDeterministicTestCases(
        requirement.code,
        requirement.title,
        requirement.description,
        requirement.acceptanceCriteria
      );
      result = {
        provider: 'mock',
        model: 'fallback-heuristic-engine',
        promptVersion: 'v1.0-fallback',
        inputTokens: 0,
        outputTokens: 0,
        responseTimeMs: 12,
        estimatedCost: 0,
        cases,
      };
    }

    const responseTimeMs = Date.now() - startTime;

    // 6. Transacción Atómica en Base de Datos
    const createdCases = await prisma.$transaction(async (tx) => {
      // Limpieza de casos previos no aprobados si se solicitó
      if (clearPreviousUnapproved) {
        await tx.testCase.deleteMany({
          where: {
            requirementId,
            status: { in: ['PENDING', 'REJECTED'] },
          },
        });
      }

      // Registro de métricas de telemetría de IA
      await tx.aiGeneration.create({
        data: {
          requirementId,
          provider: result.provider,
          model: result.model,
          promptVersion: result.promptVersion || 'v1.0',
          inputTokens: result.inputTokens,
          outputTokens: result.outputTokens,
          estimatedCost: result.estimatedCost,
          responseTimeMs,
          inputHash,
        },
      });

      // Inserción de casos de prueba generados
      const existingCount = await tx.testCase.count({ where: { requirementId } });
      const inserted = [];

      for (let i = 0; i < result.cases.length; i++) {
        const c: RawGeneratedCase = result.cases[i];
        const code = `CP-${String(existingCount + i + 1).padStart(3, '0')}`;
        const row = await tx.testCase.create({
          data: {
            requirementId,
            code,
            type: c.type,
            title: c.title,
            preconditions: JSON.stringify(c.preconditions || []),
            steps: JSON.stringify(c.steps || []),
            testData: c.testData || null,
            expectedResult: c.expectedResult,
            priority: c.priority || 'medium',
            evidenceStatus: c.evidenceStatus || 'derived',
            evidenceText: c.evidenceText || null,
            source: 'AI_GENERATED',
            status: 'PENDING',
          },
        });
        inserted.push(row);
      }

      // Actualizar estado del requisito
      await tx.requirement.update({
        where: { id: requirementId },
        data: { status: 'GENERATED' },
      });

      return inserted;
    });

    // 7. Auditoría
    logger.info(
      {
        action: 'AI_GENERATION',
        requirementId,
        userId,
        provider: result.provider,
        casesCount: createdCases.length,
        costUsd: result.estimatedCost,
      },
      '[Audit] Generación de casos con IA completada exitosamente'
    );

    return {
      cases: createdCases.map((c) => TestCaseMapper.toDTO(c as unknown as PrismaTestCaseRow)),
      generation: {
        provider: result.provider,
        model: result.model,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        estimatedCost: result.estimatedCost,
        responseTimeMs,
        cached: false,
      },
    };
  }
}
