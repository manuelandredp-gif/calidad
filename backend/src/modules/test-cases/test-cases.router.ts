import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/prisma';
import { sendSuccess, sendPaginated, getPagination, buildPaginationMeta } from '../../common/utils/api-response';
import { authenticateJWT } from '../../common/middleware/auth.middleware';
import { asyncHandler } from '../../common/middleware/async-handler';
import {
  assertProjectAccess,
  assertRequirementAccess,
  assertTestCaseAccess,
} from '../../common/utils/ownership';
import { ReviewTestCaseUseCase } from '../../application/use-cases/review-test-case.use-case';
import { CreateManualTestCaseUseCase } from '../../application/use-cases/create-manual-test-case.use-case';
import { GenerateFromTemplateUseCase } from '../../application/use-cases/generate-from-template.use-case';
import { GenerateFromBvaUseCase } from '../../application/use-cases/generate-from-bva.use-case';
import { SyntheticDataEngine } from '../../core/test-design/synthetic-data';
import { ISTQB_TEMPLATES } from '../../core/templates/istqb-templates';

export const testCasesRouter = Router();

testCasesRouter.use(authenticateJWT);

const reviewSchema = z.object({
  decision: z.enum(['APPROVED', 'MODIFIED', 'REJECTED']),
  comments: z.string().optional(),
  justification: z.string().optional(),
  expectedVersion: z.number().int().positive().optional(),
  title: z.string().min(3).optional(),
  preconditions: z.array(z.string()).optional(),
  steps: z.array(z.string().min(1)).min(1).optional(),
  testData: z.string().optional().nullable(),
  expectedResult: z.string().min(3).optional(),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  evidenceStatus: z.enum(['derived', 'suggested', 'ambiguous', 'conflict', 'pending']).optional(),
  evidenceText: z.string().optional().nullable(),
});

const reviewsInclude = {
  reviews: {
    orderBy: { createdAt: 'desc' as const },
    include: { reviewer: { select: { id: true, fullName: true, role: true } } },
  },
};

// GET /api/v1/test-cases/project/:projectId - Casos de prueba de un proyecto (paginado con filtros)
testCasesRouter.get(
  '/project/:projectId',
  asyncHandler(async (req: Request, res: Response) => {
    await assertProjectAccess(req.params.projectId, req.user!.userId, req.user!.role);
    const { page, pageSize, skip, take } = getPagination(req);
    const statusFilter = req.query.status as string | undefined;

    const where: Record<string, unknown> = {
      requirement: { projectId: req.params.projectId },
    };

    if (statusFilter && ['PENDING', 'APPROVED', 'MODIFIED', 'REJECTED'].includes(statusFilter)) {
      where.status = statusFilter;
    }

    const [total, cases] = await Promise.all([
      prisma.testCase.count({ where }),
      prisma.testCase.findMany({
        where,
        orderBy: { code: 'asc' },
        skip,
        take,
        include: {
          requirement: { select: { id: true, code: true, title: true, version: true } },
          ...reviewsInclude,
        },
      }),
    ]);

    return sendPaginated(res, cases, buildPaginationMeta(page, pageSize, total));
  })
);

// GET /api/v1/test-cases/requirement/:requirementId - Casos de un requisito
testCasesRouter.get(
  '/requirement/:requirementId',
  asyncHandler(async (req: Request, res: Response) => {
    await assertRequirementAccess(req.params.requirementId, req.user!.userId, req.user!.role);
    const cases = await prisma.testCase.findMany({
      where: { requirementId: req.params.requirementId },
      orderBy: { code: 'asc' },
      include: {
        requirement: { select: { id: true, code: true, title: true, version: true } },
        ...reviewsInclude,
      },
    });
    return sendSuccess(res, cases);
  })
);

// ==========================================================================
// RF-15 & Técnicas ISTQB: Creación de casos SIN IA
// ==========================================================================
// RF-15: Creación de casos SIN IA (Manual y Plantillas ISTQB)
// ==========================================================================

const manualCaseSchema = z.object({
  requirementId: z.string().uuid('ID de requisito inválido'),
  type: z.enum(['positive', 'negative', 'alternative', 'boundary', 'validation']),
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
  preconditions: z.array(z.string()).optional().default([]),
  steps: z.array(z.string().min(1)).min(1, 'Se requiere al menos un paso'),
  testData: z.string().optional().nullable(),
  expectedResult: z.string().min(3, 'El resultado esperado debe tener al menos 3 caracteres'),
  priority: z.enum(['high', 'medium', 'low']),
});

const templateSchema = z.object({
  requirementId: z.string().uuid('ID de requisito inválido'),
  templateCategory: z.string().min(1, 'La categoría de plantilla es obligatoria'),
});

// POST /api/v1/test-cases/manual - Crear un caso de prueba manualmente (sin IA)
testCasesRouter.post(
  '/manual',
  asyncHandler(async (req: Request, res: Response) => {
    const input = manualCaseSchema.parse(req.body);

    const useCase = new CreateManualTestCaseUseCase();
    const result = await useCase.execute({
      ...input,
      userId: req.user!.userId,
      userRole: req.user!.role,
    });

    return sendSuccess(res, result, 'Caso de prueba creado manualmente', 201);
  })
);

// POST /api/v1/test-cases/from-template - Generar casos desde plantilla ISTQB (sin IA)
testCasesRouter.post(
  '/from-template',
  asyncHandler(async (req: Request, res: Response) => {
    const { requirementId, templateCategory } = templateSchema.parse(req.body);

    const useCase = new GenerateFromTemplateUseCase();
    const result = await useCase.execute({
      requirementId,
      templateCategory,
      userId: req.user!.userId,
      userRole: req.user!.role,
    });

    return sendSuccess(
      res,
      result,
      `Se generaron ${result.templateUsed.casesGenerated} casos desde la plantilla "${result.templateUsed.name}"`,
      201
    );
  })
);

// GET /api/v1/test-cases/templates - Listar plantillas ISTQB disponibles
testCasesRouter.get(
  '/templates',
  asyncHandler(async (_req: Request, res: Response) => {
    const templates = ISTQB_TEMPLATES.map((t) => ({
      key: t.key,
      name: t.name,
      description: t.description,
      icon: t.icon,
      casesCount: t.cases.length,
    }));

    return sendSuccess(res, templates, `${templates.length} plantillas ISTQB disponibles`);
  })
);

const bvaSchema = z.object({
  requirementId: z.string().uuid('ID de requisito inválido'),
  variable: z.object({
    name: z.string().min(2, 'El nombre de la variable debe tener al menos 2 caracteres'),
    type: z.enum(['integer', 'decimal', 'string_length']),
    min: z.number(),
    max: z.number(),
    unit: z.string().optional(),
    decimals: z.number().int().min(1).max(6).optional(),
  }),
});

// POST /api/v1/test-cases/from-bva - Generar casos deterministas con Análisis de Valores Límite
testCasesRouter.post(
  '/from-bva',
  asyncHandler(async (req: Request, res: Response) => {
    const { requirementId, variable } = bvaSchema.parse(req.body);

    const useCase = new GenerateFromBvaUseCase();
    const result = await useCase.execute({
      requirementId,
      variable,
      userId: req.user!.userId,
      userRole: req.user!.role,
    });

    return sendSuccess(
      res,
      result,
      `Se generaron ${result.bvaSummary.casesInserted} casos formales de BVA para "${variable.name}"`,
      201
    );
  })
);

// GET /api/v1/test-cases/synthetic-data - Generar lote de datos sintéticos de prueba matemáticos
testCasesRouter.get(
  '/synthetic-data',
  asyncHandler(async (_req: Request, res: Response) => {
    const data = {
      luhnCards: {
        visaValid: SyntheticDataEngine.generateLuhnCard('visa', true),
        visaInvalid: SyntheticDataEngine.generateLuhnCard('visa', false),
        mastercardValid: SyntheticDataEngine.generateLuhnCard('mastercard', true),
        amexValid: SyntheticDataEngine.generateLuhnCard('amex', true),
      },
      peruvianDocs: {
        dniValid: SyntheticDataEngine.generateDni(true),
        dniInvalid: SyntheticDataEngine.generateDni(false),
        rucNaturalValid: SyntheticDataEngine.generateRuc('natural', true),
        rucJuridicaValid: SyntheticDataEngine.generateRuc('juridica', true),
        rucInvalid: SyntheticDataEngine.generateRuc('juridica', false),
      },
      boundaryStrings: SyntheticDataEngine.getBoundaryDataSet(255),
      emails: {
        valid: SyntheticDataEngine.getSyntheticEmail(true),
        invalid: SyntheticDataEngine.getSyntheticEmail(false),
      },
    };

    return sendSuccess(res, data, 'Datos sintéticos de prueba generados exitosamente');
  })
);

// POST /api/v1/test-cases/synthetic-data/validate - Validar dato contra algoritmos oficiales
testCasesRouter.post(
  '/synthetic-data/validate',
  asyncHandler(async (req: Request, res: Response) => {
    const { type, value } = z
      .object({
        type: z.enum(['luhn_card', 'ruc_pe', 'dni_pe']),
        value: z.string().min(1),
      })
      .parse(req.body);

    let isValid = false;
    let description = '';

    if (type === 'luhn_card') {
      isValid = SyntheticDataEngine.validateLuhn(value);
      description = isValid
        ? 'Tarjeta válida según el algoritmo de Luhn (ISO/IEC 7812)'
        : 'Tarjeta inválida: no cumple el algoritmo de Luhn';
    } else if (type === 'ruc_pe') {
      isValid = SyntheticDataEngine.validateRuc(value);
      description = isValid
        ? 'RUC válido según Módulo 11 de SUNAT'
        : 'RUC inválido: prefijo no reconocido o dígito verificador incorrecto';
    } else if (type === 'dni_pe') {
      isValid = /^\d{8}$/.test(value.trim());
      description = isValid
        ? 'DNI formalmente válido (8 dígitos numéricos)'
        : 'DNI inválido: debe contener exactamente 8 dígitos numéricos';
    }

    return sendSuccess(res, { type, value, isValid, description });
  })
);

// ==========================================================================
// Rutas parametrizadas por ID (al final para no colisionar con rutas estáticas)
// ==========================================================================

// GET /api/v1/test-cases/:id - Caso individual con trazabilidad y revisiones
testCasesRouter.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    await assertTestCaseAccess(req.params.id, req.user!.userId, req.user!.role);
    const testCase = await prisma.testCase.findUnique({
      where: { id: req.params.id },
      include: {
        requirement: {
          select: { id: true, code: true, title: true, description: true, acceptanceCriteria: true, version: true, projectId: true },
        },
        generation: {
          select: { id: true, provider: true, model: true, inputTokens: true, outputTokens: true, estimatedCost: true, responseTimeMs: true, createdAt: true },
        },
        ...reviewsInclude,
      },
    });
    return sendSuccess(res, testCase);
  })
);

// GET /api/v1/test-cases/:id/history - Historial de revisiones (antes vs después del mismo caso)
testCasesRouter.get(
  '/:id/history',
  asyncHandler(async (req: Request, res: Response) => {
    await assertTestCaseAccess(req.params.id, req.user!.userId, req.user!.role);
    const reviews = await prisma.testCaseReview.findMany({
      where: { testCaseId: req.params.id },
      orderBy: { createdAt: 'desc' },
      include: {
        reviewer: { select: { id: true, fullName: true, role: true } },
      },
    });
    return sendSuccess(res, reviews);
  })
);

// PATCH /api/v1/test-cases/:id/review - Punto Único de Revisión, Edición y Aprobación/Rechazo
testCasesRouter.patch(
  '/:id/review',
  asyncHandler(async (req: Request, res: Response) => {
    await assertTestCaseAccess(req.params.id, req.user!.userId, req.user!.role);
    const { decision, comments, justification, expectedVersion, ...updates } = reviewSchema.parse(req.body);

    const useCase = new ReviewTestCaseUseCase();
    const result = await useCase.execute({
      testCaseId: req.params.id,
      reviewerId: req.user!.userId,
      reviewerRole: req.user!.role,
      decision,
      comments,
      justification,
      expectedVersion,
      updates: Object.keys(updates).length > 0 ? updates : undefined,
    });

    return sendSuccess(
      res,
      result,
      `Caso de prueba procesado como '${decision}' exitosamente`
    );
  })
);


