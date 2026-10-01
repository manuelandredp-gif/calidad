import { describe, it, expect } from 'vitest';
import { CodeGenerators } from '../src/modules/export/code-generators';
import { ExportProject } from '../src/modules/export/export.service';

describe('CodeGenerators (Mejoras #26 y #29)', () => {
  const mockProject: ExportProject = {
    id: 'proj-123',
    name: 'E-Commerce Core',
    description: 'Sistema de compras',
    requirements: [
      {
        id: 'req-1',
        code: 'REQ-001',
        title: 'Inicio de Sesión',
        description: 'Permite autenticar clientes',
        acceptanceCriteria: 'Dado un usuario registrado, cuando ingresa clave válida, entonces accede.',
        version: 1,
        testCases: [
          {
            code: 'CP-001',
            type: 'positive',
            title: 'Login exitoso',
            preconditions: '["Usuario existe"]',
            steps: '["Ingresar usuario", "Ingresar clave", "Presionar botón Entrar"]',
            testData: 'test@example.com',
            expectedResult: 'Redirección al dashboard principal',
            priority: 'high',
            evidenceStatus: 'derived',
            evidenceText: null,
            status: 'APPROVED',
          },
        ],
      },
    ],
  };

  it('genera script Playwright ejecutable y válido', () => {
    const code = CodeGenerators.buildPlaywright(mockProject);
    expect(code).toContain("import { test, expect } from '@playwright/test'");
    expect(code).toContain("test.describe('REQ-001 - Inicio de Sesión'");
    expect(code).toContain("test('CP-001: Login exitoso'");
    expect(code).toContain('await page.goto');
  });

  it('genera script Cypress ejecutable', () => {
    const code = CodeGenerators.buildCypress(mockProject);
    expect(code).toContain("describe('REQ-001 - Inicio de Sesión'");
    expect(code).toContain("it('CP-001: Login exitoso'");
    expect(code).toContain('cy.visit');
  });

  it('genera archivo Cucumber Gherkin (.feature) en español', () => {
    const gherkin = CodeGenerators.buildGherkin(mockProject);
    expect(gherkin).toContain('Característica: E-Commerce Core');
    expect(gherkin).toContain('Escenario: CP-001 - Login exitoso');
    expect(gherkin).toContain('Dado');
    expect(gherkin).toContain('Cuando');
    expect(gherkin).toContain('Entonces');
  });

  it('genera colección Postman v2.1.0 estructurada con assertions', () => {
    const postman = CodeGenerators.buildPostmanCollection(mockProject) as {
      info: { name: string };
      item: Array<{ item: Array<{ request: { url: { raw: string } }; event: Array<{ script: { exec: string[] } }> }> }>;
    };
    expect(postman.info.name).toContain('E-Commerce Core');
    expect(postman.item).toHaveLength(1);
    expect(postman.item[0].item[0].request.url.raw).toContain('{{baseUrl}}');
    expect(postman.item[0].item[0].event[0].script.exec[0]).toContain('pm.test');
  });

});
