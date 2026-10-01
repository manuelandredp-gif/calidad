import type { Express, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';

/**
 * Especificación OpenAPI 3.0 (resumida) de la API TestGenAI.
 * Se sirve la UI interactiva en /api/docs y el JSON crudo en /api/docs.json.
 */
export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'TestGenAI API',
    version: '1.0.0',
    description:
      'API REST para derivación automatizada de casos de prueba (IA + heurísticas ISTQB) con auditoría humana y trazabilidad. Todas las rutas están disponibles bajo /api/v1 (y su alias /api).',
  },
  servers: [{ url: '/api/v1', description: 'API v1' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      ApiError: {
        type: 'object',
        properties: { success: { type: 'boolean', example: false }, error: { type: 'string' } },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: { token: { type: 'string' }, user: { type: 'object' } },
          },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/auth/register': {
      post: { tags: ['Auth'], summary: 'Registrar usuario', security: [], responses: { '201': { description: 'Creado' } } },
    },
    '/auth/login': {
      post: { tags: ['Auth'], summary: 'Iniciar sesión', security: [], responses: { '200': { description: 'OK' } } },
    },
    '/auth/me': {
      get: { tags: ['Auth'], summary: 'Perfil del usuario autenticado', responses: { '200': { description: 'OK' } } },
    },
    '/projects': {
      get: {
        tags: ['Projects'],
        summary: 'Listar proyectos del usuario (paginado)',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { '200': { description: 'OK' } },
      },
      post: { tags: ['Projects'], summary: 'Crear proyecto', responses: { '201': { description: 'Creado' } } },
    },
    '/projects/{id}': {
      get: { tags: ['Projects'], summary: 'Detalle de proyecto', responses: { '200': { description: 'OK' }, '404': { description: 'No encontrado' } } },
      put: { tags: ['Projects'], summary: 'Actualizar proyecto', responses: { '200': { description: 'OK' } } },
      delete: { tags: ['Projects'], summary: 'Eliminar proyecto', responses: { '200': { description: 'OK' } } },
    },
    '/requirements': {
      post: { tags: ['Requirements'], summary: 'Crear requisito', responses: { '201': { description: 'Creado' } } },
    },
    '/requirements/project/{projectId}': {
      get: { tags: ['Requirements'], summary: 'Requisitos de un proyecto (paginado)', responses: { '200': { description: 'OK' } } },
    },
    '/ai/generate': {
      post: {
        tags: ['IA'],
        summary: 'Generar casos de prueba con IA (con repuesto heurístico y control de presupuesto)',
        responses: { '201': { description: 'Generado' }, '402': { description: 'Presupuesto de IA agotado' } },
      },
    },
    '/heuristics/generate': {
      post: { tags: ['Heurísticas'], summary: 'Generación determinista sin IA (0 tokens)', responses: { '201': { description: 'Generado' } } },
    },
    '/test-cases/{id}/review': {
      patch: { tags: ['TestCases'], summary: 'Revisión humana (aprobar/modificar/rechazar)', responses: { '200': { description: 'OK' } } },
    },
    '/metrics/project/{projectId}': {
      get: { tags: ['Métricas'], summary: 'Métricas ISTQB y economía de IA del proyecto', responses: { '200': { description: 'OK' } } },
    },
    '/export/{projectId}': {
      get: { tags: ['Export'], summary: 'Exportar (json | csv | markdown)', responses: { '200': { description: 'OK' } } },
    },
    '/traceability/{projectId}': {
      get: { tags: ['Trazabilidad'], summary: 'Matriz de trazabilidad bidireccional', responses: { '200': { description: 'OK' } } },
    },
  },
} as const;

export function mountSwagger(app: Express) {
  app.get('/api/docs.json', (_req: Request, res: Response) => res.json(openApiSpec));
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec, { customSiteTitle: 'TestGenAI API Docs' }));
}
