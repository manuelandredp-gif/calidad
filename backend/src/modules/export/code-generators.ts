import { ExportProject, ExportTestCase } from './export.service';
import { safeJsonArray } from '../../common/utils/json';

export class CodeGenerators {
  /**
   * Genera especificaciones de prueba ejecutables en Playwright (TypeScript). (Mejora #26)
   */
  static buildPlaywright(project: ExportProject, onlyApproved: boolean = false): string {
    let code = `import { test, expect } from '@playwright/test';\n\n`;
    code += `/**\n * Suite de Automatización Playwright generada automáticamente por TestGenAI\n`;
    code += ` * Proyecto: ${project.name}\n`;
    code += ` * Fecha: ${new Date().toISOString()}\n */\n\n`;

    project.requirements.forEach((req) => {
      const filteredCases = onlyApproved
        ? req.testCases.filter((tc) => tc.status === 'APPROVED')
        : req.testCases;

      if (filteredCases.length === 0) return;

      code += `test.describe('${req.code} - ${this.escapeString(req.title)}', () => {\n`;
      code += `  test.beforeEach(async ({ page }) => {\n`;
      code += `    // Configuración base de la prueba\n`;
      code += `    await page.goto('/');\n`;
      code += `  });\n\n`;

      filteredCases.forEach((tc) => {
        const steps = safeJsonArray(tc.steps) as string[];
        const preconditions = safeJsonArray(tc.preconditions) as string[];

        code += `  test('${tc.code}: ${this.escapeString(tc.title)}', async ({ page }) => {\n`;
        if (preconditions.length > 0) {
          code += `    // Precondiciones:\n`;
          preconditions.forEach((p) => (code += `    // - ${p}\n`));
        }

        code += `    // Pasos de ejecución:\n`;
        steps.forEach((step, idx) => {
          code += `    // Paso ${idx + 1}: ${step}\n`;
          // Generar acción heurística aproximada
          if (/clic|click|presionar|seleccionar/i.test(step)) {
            code += `    await page.click('button:has-text("${this.extractKeyword(step)}")');\n`;
          } else if (/ingresar|escribir|completar/i.test(step)) {
            code += `    await page.fill('input[type="text"]', '${tc.testData || "test_value"}');\n`;
          } else if (/navegar|ir a|acceder/i.test(step)) {
            code += `    await page.waitForLoadState('networkidle');\n`;
          } else {
            code += `    // TODO: implementar interacción específica para "${this.escapeString(step)}"\n`;
          }
        });

        code += `\n    // Verificación de Resultado Esperado: "${this.escapeString(tc.expectedResult)}"\n`;
        code += `    await expect(page.locator('body')).toBeVisible();\n`;
        code += `  });\n\n`;
      });

      code += `});\n\n`;
    });

    return code;
  }

  /**
   * Genera especificaciones de prueba para Cypress (JavaScript / TypeScript). (Mejora #26)
   */
  static buildCypress(project: ExportProject, onlyApproved: boolean = false): string {
    let code = `/// <reference types="cypress" />\n\n`;
    code += `/**\n * Suite de Automatización Cypress generada por TestGenAI\n`;
    code += ` * Proyecto: ${project.name}\n */\n\n`;

    project.requirements.forEach((req) => {
      const filteredCases = onlyApproved
        ? req.testCases.filter((tc) => tc.status === 'APPROVED')
        : req.testCases;

      if (filteredCases.length === 0) return;

      code += `describe('${req.code} - ${this.escapeString(req.title)}', () => {\n`;
      code += `  beforeEach(() => {\n`;
      code += `    cy.visit('/');\n`;
      code += `  });\n\n`;

      filteredCases.forEach((tc) => {
        const steps = safeJsonArray(tc.steps) as string[];

        code += `  it('${tc.code}: ${this.escapeString(tc.title)}', () => {\n`;
        steps.forEach((step, idx) => {
          code += `    // Paso ${idx + 1}: ${step}\n`;
          if (/clic|click|presionar/i.test(step)) {
            code += `    cy.contains('button', '${this.extractKeyword(step)}').click();\n`;
          } else if (/ingresar|escribir/i.test(step)) {
            code += `    cy.get('input').first().type('${tc.testData || "test"}');\n`;
          } else {
            code += `    // cy.log('${this.escapeString(step)}');\n`;
          }
        });
        code += `    // Verificación esperada: ${this.escapeString(tc.expectedResult)}\n`;
        code += `    cy.get('body').should('exist');\n`;
        code += `  });\n\n`;
      });

      code += `});\n\n`;
    });

    return code;
  }

  /**
   * Genera archivo de especificación Cucumber / Gherkin (.feature). (Mejora #26)
   */
  static buildGherkin(project: ExportProject, onlyApproved: boolean = false): string {
    let feature = `# language: es\n`;
    feature += `@proyecto @${this.slugify(project.name)}\n`;
    feature += `Característica: ${project.name}\n`;
    if (project.description) {
      feature += `  ${project.description.replace(/\n/g, '\n  ')}\n\n`;
    } else {
      feature += `\n`;
    }

    project.requirements.forEach((req) => {
      const filteredCases = onlyApproved
        ? req.testCases.filter((tc) => tc.status === 'APPROVED')
        : req.testCases;

      if (filteredCases.length === 0) return;

      feature += `  # ========================================================\n`;
      feature += `  # Requisito: [${req.code}] ${req.title}\n`;
      feature += `  # ========================================================\n\n`;

      filteredCases.forEach((tc) => {
        const preconditions = safeJsonArray(tc.preconditions) as string[];
        const steps = safeJsonArray(tc.steps) as string[];
        const tag = tc.type === 'negative' ? '@negativo' : tc.type === 'boundary' ? '@limite' : '@positivo';

        feature += `  ${tag} @prioridad_${tc.priority}\n`;
        feature += `  Escenario: ${tc.code} - ${tc.title}\n`;

        if (preconditions.length > 0) {
          preconditions.forEach((p, idx) => {
            const keyword = idx === 0 ? 'Dado' : 'Y';
            feature += `    ${keyword} ${p}\n`;
          });
        } else {
          feature += `    Dado que el usuario accede al sistema\n`;
        }

        if (steps.length > 0) {
          steps.forEach((step, idx) => {
            const keyword = idx === 0 ? 'Cuando' : 'Y';
            feature += `    ${keyword} ${step}\n`;
          });
        }

        feature += `    Entonces ${tc.expectedResult}\n\n`;
      });
    });

    return feature;
  }

  /**
   * Genera una Colección API en formato Postman v2.1.0 y Bruno. (Mejora #29)
   */
  static buildPostmanCollection(project: ExportProject, onlyApproved: boolean = false): object {
    const items: Record<string, unknown>[] = [];


    project.requirements.forEach((req) => {
      const filteredCases = onlyApproved
        ? req.testCases.filter((tc) => tc.status === 'APPROVED')
        : req.testCases;

      if (filteredCases.length === 0) return;

      const folderItems = filteredCases.map((tc) => {
        const steps = safeJsonArray(tc.steps) as string[];
        const method = this.inferHttpMethod(tc);
        const urlPath = `/api/v1/${this.slugify(req.title)}`;

        return {
          name: `[${tc.code}] ${tc.title}`,
          request: {
            method,
            header: [
              { key: 'Content-Type', value: 'application/json' },
              { key: 'Accept', value: 'application/json' },
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify(
                {
                  testCaseCode: tc.code,
                  testData: tc.testData || undefined,
                  mockPayload: true,
                },
                null,
                2
              ),
            },
            url: {
              raw: `{{baseUrl}}${urlPath}`,
              host: ['{{baseUrl}}'],
              path: urlPath.split('/').filter(Boolean),
            },
            description: `Pasos:\n${steps.join('\n')}\n\nResultado Esperado: ${tc.expectedResult}`,
          },
          event: [
            {
              listen: 'test',
              script: {
                exec: [
                  `pm.test("Status code check for ${tc.code}", function () {`,
                  tc.type === 'negative'
                    ? `    pm.expect(pm.response.code).to.be.oneOf([400, 401, 403, 404, 422]);`
                    : `    pm.expect(pm.response.code).to.be.oneOf([200, 201, 204]);`,
                  '});',
                  'pm.test("Response time is acceptable", function () {',
                  '    pm.expect(pm.response.responseTime).to.be.below(2000);',
                  '});',
                ],
                type: 'text/javascript',
              },
            },
          ],
        };
      });

      items.push({
        name: `[${req.code}] ${req.title}`,
        item: folderItems,
      });
    });

    return {
      info: {
        _postman_id: project.id,
        name: `TestGenAI - ${project.name}`,
        description: project.description || 'Colección de pruebas generada automáticamente por TestGenAI',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      variable: [
        {
          key: 'baseUrl',
          value: 'http://localhost:3000',
          type: 'string',
        },
      ],
      item: items,
    };
  }

  private static escapeString(str: string): string {
    return (str || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, ' ');
  }

  private static slugify(str: string): string {
    return (str || '')
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '_')
      .replace(/^-+|-+$/g, '');
  }

  private static extractKeyword(step: string): string {
    const match = step.match(/(?:botón|boton|campo|opción|opcion|enlace)\s+["']?([^"',.;\n]+)["']?/i);
    return match ? match[1].trim() : 'Continuar';
  }

  private static inferHttpMethod(tc: ExportTestCase): string {
    const lower = `${tc.title} ${tc.expectedResult}`.toLowerCase();
    if (lower.includes('eliminar') || lower.includes('borrar') || lower.includes('delete')) return 'DELETE';
    if (lower.includes('actualizar') || lower.includes('modificar') || lower.includes('editar') || lower.includes('put')) return 'PUT';
    if (lower.includes('crear') || lower.includes('registrar') || lower.includes('enviar') || lower.includes('post')) return 'POST';
    return 'GET';
  }
}
