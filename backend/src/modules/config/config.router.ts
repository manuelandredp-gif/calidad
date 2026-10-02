import { Router, Request, Response } from 'express';
import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import { sendSuccess } from '../../common/utils/api-response';
import { authenticateJWT } from '../../common/middleware/auth.middleware';
import { asyncHandler } from '../../common/middleware/async-handler';
import { AI_PRICING_TABLE } from '../../config/ai-pricing';

export const configRouter = Router();

configRouter.use(authenticateJWT);

// GET /api/v1/config/ai-providers - Estado de configuración y capacidades de proveedores de IA
configRouter.get(
  '/ai-providers',
  asyncHandler(async (_req: Request, res: Response) => {
    const geminiAvailable = Boolean(env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim().length > 0);
    const openaiAvailable = Boolean(env.OPENAI_API_KEY && env.OPENAI_API_KEY.trim().length > 0);

    const providers = [
      { id: 'gemini', name: 'Google Gemini', isConfigured: geminiAvailable, isDefault: env.AI_PROVIDER_DEFAULT === 'gemini', supportedModels: [{ id: env.AI_GEMINI_MODEL, name: env.AI_GEMINI_MODEL, pricing: AI_PRICING_TABLE[env.AI_GEMINI_MODEL] ?? null }] },
      { id: 'openai', name: 'OpenAI', isConfigured: openaiAvailable, isDefault: env.AI_PROVIDER_DEFAULT === 'openai', supportedModels: [{ id: env.AI_OPENAI_MODEL, name: env.AI_OPENAI_MODEL, pricing: AI_PRICING_TABLE[env.AI_OPENAI_MODEL] ?? null }] },
    ];

    return sendSuccess(res, {
      defaultProvider: env.AI_PROVIDER_DEFAULT,
      budgetLimitUsd: env.AI_PROJECT_BUDGET_USD,
      providers,
    });
  })
);

configRouter.get('/database', asyncHandler(async (req: Request, res: Response) => {
  await prisma.$queryRaw`SELECT 1`;
  const scope = req.user!.role === 'ADMIN' ? {} : { ownerId: req.user!.userId };
  const [projects, requirements, testCases] = await Promise.all([
    prisma.project.count({ where: scope }),
    prisma.requirement.count({ where: { project: scope } }),
    prisma.testCase.count({ where: { requirement: { project: scope } } }),
  ]);
  const users = req.user!.role === 'ADMIN' ? await prisma.user.count() : null;
  return sendSuccess(res, { engine: 'PostgreSQL', status: 'connected', counts: { users, projects, requirements, testCases } });
}));
