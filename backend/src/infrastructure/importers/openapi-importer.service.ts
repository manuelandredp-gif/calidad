import { prisma } from '../../config/prisma';
import { ApiError } from '../../common/errors/api-error';

/** Import only behavior explicitly declared by the supplied API contract. */
export class OpenApiImporterService {
  public static async importOpenApiSpec(projectId: string, spec: Record<string, unknown>) {
    if (!spec.paths || typeof spec.paths !== 'object' || Array.isArray(spec.paths)) throw ApiError.badRequest('La especificación requiere paths válidos.');
    const operations: Array<{ path: string; method: string; summary: string; description: string; responses: Array<{ status: string; description: string }> }> = [];
    for (const [path, value] of Object.entries(spec.paths)) {
      if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
      for (const [method, raw] of Object.entries(value)) {
        if (!['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace'].includes(method)) continue;
        if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw ApiError.badRequest(`Operación inválida: ${method} ${path}`);
        const op = raw as Record<string, unknown>;
        const responses = Object.entries((op.responses || {}) as Record<string, unknown>).filter(([status]) => /^[1-5][0-9]{2}$/.test(status)).map(([status, response]) => {
          const content = response as Record<string, unknown>;
          if (!content || typeof content.description !== 'string') throw ApiError.badRequest(`Respuesta ${status} sin descripción en ${method} ${path}. Resuelva referencias antes de importar.`);
          return { status, description: content.description };
        });
        if (!responses.length) throw ApiError.badRequest(`No hay respuestas HTTP explícitas en ${method} ${path}. No se inventan resultados esperados.`);
        operations.push({ path, method, summary: String(op.summary || `${method.toUpperCase()} ${path}`), description: String(op.description || `Contrato ${method.toUpperCase()} ${path}`), responses });
      }
    }
    if (!operations.length) throw ApiError.badRequest('No hay operaciones HTTP para importar.');
    return prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM projects WHERE id = ${projectId} FOR UPDATE`;
      const project = await tx.project.findUniqueOrThrow({ where: { id: projectId } });
      if (project.status === 'ARCHIVED') throw ApiError.forbidden('El proyecto está archivado.');
      let next = project.nextRequirementNumber;
      const requirements = [];
      for (const op of operations) {
        let code: string;
        do { code = `REQ-${String(next++).padStart(3, '0')}`; }
        while (await tx.requirement.findUnique({ where: { projectId_code: { projectId, code } } }));
        const acceptanceCriteria = op.responses.map(r => `HTTP ${r.status}: ${r.description}`).join('\n');
        const requirement = await tx.requirement.create({ data: {
          projectId, code, title: `[API] ${op.summary}`, description: op.description,
          acceptanceCriteria, status: 'GENERATED', nextCaseNumber: op.responses.length + 1,
          versions: { create: { version: 1, title: `[API] ${op.summary}`, description: op.description, acceptanceCriteria, changeSummary: 'Importación de contrato OpenAPI' } },
          testCases: { create: op.responses.map((r, index) => ({
            code: `CP-${String(index + 1).padStart(3, '0')}`, type: Number(r.status) < 400 ? 'positive' : 'negative',
            title: `[API ${r.status}] ${op.method.toUpperCase()} ${op.path}`,
            preconditions: ['Preparar las condiciones indicadas por el contrato para esta respuesta.'],
            steps: [`Enviar ${op.method.toUpperCase()} ${op.path} con los parámetros definidos en el contrato.`, `Verificar HTTP ${r.status} y el contenido documentado.`],
            expectedResult: `HTTP ${r.status}: ${r.description}`, priority: 'medium', evidenceStatus: 'derived',
            evidenceText: `Contrato OpenAPI: paths.${op.path}.${op.method}.responses.${r.status}`,
            source: 'OPENAPI', status: 'PENDING',
          })) },
        } });
        requirements.push(requirement);
      }
      await tx.project.update({ where: { id: projectId }, data: { nextRequirementNumber: next } });
      return { projectId, totalEndpointsImported: requirements.length, requirements };
    }, { timeout: 30000 });
  }
}
