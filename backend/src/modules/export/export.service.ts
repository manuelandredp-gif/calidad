// Capa de servicio: constructores PUROS de exportación (sin Express ni Prisma).
import { safeJsonArray } from '../../common/utils/json';

export interface ExportTestCase {
  code: string;
  type: string;
  title: string;
  preconditions: string;
  steps: string;
  testData: string | null;
  expectedResult: string;
  priority: string;
  evidenceStatus: string;
  evidenceText: string | null;
  status: string;
}
export interface ExportRequirement {
  id: string;
  code: string;
  title: string;
  description: string;
  acceptanceCriteria: string;
  version: number;
  testCases: ExportTestCase[];
}
export interface ExportProject {
  id: string;
  name: string;
  description: string | null;
  requirements: ExportRequirement[];
}

const csvCell = (text: string | null | undefined) =>
  `"${(text || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`;

export function buildCsv(project: ExportProject): string {
  const headers = [
    'ID_Requisito',
    'Titulo_Requisito',
    'ID_Caso',
    'Tipo',
    'Titulo_Caso',
    'Precondiciones',
    'Pasos',
    'Datos_Prueba',
    'Resultado_Esperado',
    'Prioridad',
    'Estado_Evidencia',
    'Estado_Revision',
  ];
  const rows: string[] = [headers.join(',')];

  project.requirements.forEach((reqItem) => {
    reqItem.testCases.forEach((tc) => {
      const pre = (safeJsonArray(tc.preconditions) as string[]).join('; ');
      const steps = (safeJsonArray(tc.steps) as string[]).join('; ');
      rows.push(
        [
          csvCell(reqItem.code),
          csvCell(reqItem.title),
          csvCell(tc.code),
          csvCell(tc.type),
          csvCell(tc.title),
          csvCell(pre),
          csvCell(steps),
          csvCell(tc.testData),
          csvCell(tc.expectedResult),
          csvCell(tc.priority),
          csvCell(tc.evidenceStatus),
          csvCell(tc.status),
        ].join(',')
      );
    });
  });

  return rows.join('\n');
}

export function buildMarkdown(project: ExportProject, onlyApproved: boolean): string {
  let md = `# Especificación de Casos de Prueba — ${project.name}\n\n`;
  md += `**Descripción del Proyecto:** ${project.description || 'N/A'}\n`;
  md += `**Fecha de Exportación:** ${new Date().toLocaleDateString()}\n`;
  md += `**Filtro:** ${onlyApproved ? 'Únicamente casos aprobados' : 'Todos los casos'}\n\n---\n\n`;

  project.requirements.forEach((reqItem) => {
    md += `## Requisito: [${reqItem.code}] ${reqItem.title}\n\n`;
    md += `**Descripción:**\n>${reqItem.description.replace(/\n/g, '\n> ')}\n\n`;
    md += `**Criterios de Aceptación:**\n\`\`\`\n${reqItem.acceptanceCriteria}\n\`\`\`\n\n`;
    md += `### Casos de Prueba Derivados (${reqItem.testCases.length})\n\n`;

    if (reqItem.testCases.length === 0) {
      md += `*No hay casos de prueba registrados para este requisito.*\n\n`;
    } else {
      reqItem.testCases.forEach((tc) => {
        const pre = safeJsonArray(tc.preconditions) as string[];
        const steps = safeJsonArray(tc.steps) as string[];
        md += `#### ${tc.code}: ${tc.title}\n`;
        md += `- **Tipo:** \`${tc.type.toUpperCase()}\` | **Prioridad:** \`${tc.priority}\` | **Estado:** \`${tc.status}\` | **Evidencia:** \`${tc.evidenceStatus}\`\n`;
        if (pre.length > 0) md += `- **Precondiciones:**\n  - ${pre.join('\n  - ')}\n`;
        if (steps.length > 0) {
          md += `- **Pasos de Ejecución:**\n`;
          steps.forEach((step, idx) => (md += `  ${idx + 1}. ${step}\n`));
        }
        if (tc.testData) md += `- **Datos de Prueba:** \`${tc.testData}\`\n`;
        md += `- **Resultado Esperado:** ${tc.expectedResult}\n`;
        if (tc.evidenceText) md += `- **Sustento / Evidencia:** *"${tc.evidenceText}"*\n`;
        md += `\n`;
      });
    }
    md += `---\n\n`;
  });

  return md;
}

export function buildJson(project: ExportProject) {
  return {
    project: { id: project.id, name: project.name, description: project.description },
    exportedAt: new Date().toISOString(),
    requirements: project.requirements.map((r) => ({
      id: r.id,
      code: r.code,
      title: r.title,
      description: r.description,
      acceptanceCriteria: r.acceptanceCriteria,
      version: r.version,
      testCases: r.testCases.map((tc) => ({
        code: tc.code,
        type: tc.type,
        title: tc.title,
        preconditions: safeJsonArray(tc.preconditions),
        steps: safeJsonArray(tc.steps),
        testData: tc.testData,
        expectedResult: tc.expectedResult,
        priority: tc.priority,
        evidenceStatus: tc.evidenceStatus,
        evidenceText: tc.evidenceText,
        status: tc.status,
      })),
    })),
  };
}

/** Nombre de archivo saneado para el header Content-Disposition. */
export function safeFilename(name: string): string {
  return name.replace(/\s+/g, '_').replace(/[^\w.-]/g, '');
}
