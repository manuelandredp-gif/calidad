import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/prisma';
import { sendSuccess } from '../../common/utils/api-response';
import { authenticateJWT } from '../../common/middleware/auth.middleware';
import { asyncHandler } from '../../common/middleware/async-handler';
import { assertRequirementAccess } from '../../common/utils/ownership';
import { env } from '../../config/env';
import { AIFactory } from '../../core/ai.factory';
import { HeuristicEngine } from '../../core/heuristics/heuristic-engine';
import { AIGenerationResult } from '../../core/interfaces/ai-provider.interface';
import { PromptGuard } from '../../common/security/prompt-guard';
import { PIIMasker } from '../../common/security/pii-masker';
import { GenerateTestCasesUseCase } from '../../application/use-cases/generate-test-cases.use-case';

export const aiGenerationRouter = Router();

aiGenerationRouter.use(authenticateJWT);

const generateSchema = z.object({
  requirementId: z.string().uuid('ID de requisito inválido'),
  provider: z.enum(['gemini', 'openai', 'mock']).optional(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(1).optional(),
  clearPreviousUnapproved: z.boolean().optional().default(false),
  // Si es true (por defecto), reutiliza una generación previa idéntica para no gastar tokens.
  useCache: z.boolean().optional().default(true),
});

// POST /api/ai/generate - Orquestación de generación de casos con IA (Thin Controller)
aiGenerationRouter.post(
  '/generate',
  asyncHandler(async (req: Request, res: Response) => {
    const { requirementId, provider, model, temperature, clearPreviousUnapproved, useCache } =
      generateSchema.parse(req.body);

    const useCase = new GenerateTestCasesUseCase();
    const result = await useCase.execute({
      requirementId,
      userId: req.user!.userId,
      userRole: req.user!.role,
      provider,
      model,
      temperature,
      clearPreviousUnapproved,
      useCache,
    });

    const isFromCache = result.generation.cached;
    return sendSuccess(
      res,
      {
        fromCache: isFromCache,
        audit: result.generation,
        testCases: result.cases,
      },
      isFromCache
        ? 'Se reutilizó una generación previa idéntica (0 tokens, 0 costo)'
        : `Se generaron ${result.cases.length} casos de prueba con éxito (${result.generation.provider} / ${result.generation.model})`,
      isFromCache ? 200 : 201
    );
  })
);

// GET /api/ai/history/:requirementId - Historial de llamadas de IA
aiGenerationRouter.get(
  '/history/:requirementId',
  asyncHandler(async (req: Request, res: Response) => {
    await assertRequirementAccess(req.params.requirementId, req.user!.userId, req.user!.role);
    const history = await prisma.aiGeneration.findMany({
      where: { requirementId: req.params.requirementId },
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, history);
  })
);

// POST /api/ai/stream - Generación progresiva mediante Server-Sent Events (SSE) (Mejora #2)
aiGenerationRouter.post(
  '/stream',
  asyncHandler(async (req: Request, res: Response) => {
    const { requirementId, provider, model, temperature } = generateSchema.parse(req.body);
    const requirement = await assertRequirementAccess(requirementId, req.user!.userId, req.user!.role);

    // Configuración de cabeceras SSE
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();


    const sendEvent = (event: string, data: Record<string, unknown>) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    sendEvent('progress', { step: 1, message: 'Verificando seguridad de requisitos (PromptGuard & PII)...' });

    PromptGuard.assertSafe(requirement.description);
    PromptGuard.assertSafe(requirement.acceptanceCriteria);

    const maskedDescriptionResult = PIIMasker.mask(requirement.description);
    const maskedCriteriaResult = PIIMasker.mask(requirement.acceptanceCriteria);

    sendEvent('progress', { step: 2, message: 'Invocando motor de IA y sintetizando casos de prueba...' });

    const selectedProvider = (provider || env.AI_PROVIDER_DEFAULT).toLowerCase();
    const aiProvider = AIFactory.getProvider(selectedProvider);

    let aiResult: AIGenerationResult;
    try {
      aiResult = await aiProvider.generateTestCases(
        requirement.code,
        requirement.title,
        maskedDescriptionResult.maskedText,
        maskedCriteriaResult.maskedText,
        { model, temperature }
      );
    } catch {
      sendEvent('fallback', { message: 'Proveedor externo no disponible; activando motor heurístico ISTQB...' });
      const { cases } = HeuristicEngine.generateDeterministicTestCases(
        requirement.code,
        requirement.title,
        requirement.description,
        requirement.acceptanceCriteria
      );
      aiResult = {
        provider: 'mock',
        model: 'fallback-heuristic-engine',
        promptVersion: 'v1.0-fallback',
        inputTokens: 0,
        outputTokens: 0,
        responseTimeMs: 10,
        estimatedCost: 0,
        cases,
      };
    }

    sendEvent('progress', { step: 3, message: 'Transmitiendo casos generados...' });

    for (let i = 0; i < aiResult.cases.length; i++) {
      sendEvent('case_chunk', { index: i, total: aiResult.cases.length, testCase: aiResult.cases[i] });
    }

    sendEvent('complete', {
      success: true,
      totalGenerated: aiResult.cases.length,
      provider: aiResult.provider,
      model: aiResult.model,
    });

    res.end();
  })
);

