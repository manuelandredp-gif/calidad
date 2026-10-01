// ==============================================================================
// Servicio de Exportación de Casos de Prueba (CSV, JSON, Markdown)
// Compatible con PostgreSQL Json types y seguro contra inyección de fórmulas CSV.
// ==============================================================================

export interface ExportTestCase {
  code: string;
  type: string;
  title: string;
  preconditions: unknown;
  steps: unknown;
  testData: string | null;
  expectedResult: string;
  priority: string;
  evidenceStatus: string;
  evidenceText: string | null;
  status: string;
  version?: number;
  requirementVersion?: number;
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

function parseArray(val: unknown): string[] {
  if (Array.isArray(val)) return val as string[];
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return val ? [val] : [];
    }
  }
  return [];
}

/**
 * Escapa celdas CSV y neutraliza fórmulas maliciosas (=, +, -, @, \t, \r).
 */
const csvCell = (text: string | null | undefined): string => {
  let val = (text || '').replace(/"/g, '""').replace(/\n/g, ' ');
  if (/^[=+\-@\t\r]/.test(val)) {
    val = `'${val}`;
  }
  return `"${val}"`;
};

export function buildCsv(project: ExportProject): string {
  const headers = [
    'ID_Requisito',
    'Titulo_Requisito',
    'Version_Requisito',
    'ID_Caso',
    'Tipo_ISTQB',
    'Titulo_Caso',
    'Precondiciones',
    'Pasos_Ejecucion',
    'Datos_Prueba',
    'Resultado_Esperado',
    'Prioridad',
    'Estado_Evidencia',
    'Sustento_Evidencia',
    'Estado_Revision',
  ];
  const rows: string[] = [headers.join(',')];

  project.requirements.forEach((reqItem) => {
    reqItem.testCases.forEach((tc) => {
      const pre = parseArray(tc.preconditions).join('; ');
      const steps = parseArray(tc.steps).join('; ');
      rows.push(
        [
          csvCell(reqItem.code),
          csvCell(reqItem.title),
          csvCell(String(reqItem.version)),
          csvCell(tc.code),
          csvCell(tc.type),
          csvCell(tc.title),
          csvCell(pre),
          csvCell(steps),
          csvCell(tc.testData),
          csvCell(tc.expectedResult),
          csvCell(tc.priority),
          csvCell(tc.evidenceStatus),
          csvCell(tc.evidenceText),
          csvCell(tc.status),
        ].join(',')
      );
    });
  });

  return rows.join('\r\n');
}

export function buildMarkdown(project: ExportProject): string {
  let md = `# Especificación de Casos de Prueba — ${project.name}\n\n`;
  md += `**Descripción del Proyecto:** ${project.description || 'Sin descripción'}\n`;
  md += `**Fecha de Exportación:** ${new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })}\n`;
  md += `**Alcance:** Casos de prueba APROBADOS vigentes auditados por el equipo QA.\n\n---\n\n`;

  project.requirements.forEach((reqItem) => {
    md += `## Requisito: [${reqItem.code}] ${reqItem.title} (v${reqItem.version})\n\n`;
    md += `**Descripción:**\n> ${reqItem.description.replace(/\n/g, '\n> ')}\n\n`;
    md += `**Criterios de Aceptación:**\n\`\`\`\n${reqItem.acceptanceCriteria}\n\`\`\`\n\n`;
    md += `### Casos de Prueba Aprobados (${reqItem.testCases.length})\n\n`;

    if (reqItem.testCases.length === 0) {
      md += `*No hay casos aprobados para este requisito.*\n\n`;
    } else {
      reqItem.testCases.forEach((tc) => {
        const pre = parseArray(tc.preconditions);
        const steps = parseArray(tc.steps);

        md += `#### ${tc.code}: ${tc.title}\n`;
        md += `- **Tipo ISTQB:** \`${tc.type.toUpperCase()}\` | **Prioridad:** \`${tc.priority}\` | **Evidencia:** \`${tc.evidenceStatus}\`\n`;
        if (pre.length > 0) {
          md += `- **Precondiciones:**\n  - ${pre.join('\n  - ')}\n`;
        }
        if (steps.length > 0) {
          md += `- **Pasos de Ejecución:**\n`;
          steps.forEach((step, idx) => (md += `  ${idx + 1}. ${step}\n`));
        }
        if (tc.testData) md += `- **Datos de Prueba:** \`${tc.testData}\`\n`;
        md += `- **Resultado Esperado:** ${tc.expectedResult}\n`;
        if (tc.evidenceText) md += `- **Sustento Textual:** *"${tc.evidenceText}"*\n`;
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
    filter: 'APPROVED_AND_ACTIVE_ONLY',
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
        preconditions: parseArray(tc.preconditions),
        steps: parseArray(tc.steps),
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

export function safeFilename(name: string): string {
  return name.replace(/\s+/g, '_').replace(/[^\w.-]/g, '');
}
