import { describe, it, expect } from 'vitest';
import { JiraXrayConnector } from '../src/integrations/jira-xray.connector';
import { DevOpsGitHubConnector } from '../src/integrations/devops-github.connector';
import { GitSyncService } from '../src/integrations/git-sync.service';
import { TwoFactorService } from '../src/security/two-factor.service';
import { SearchArchiveService } from '../src/services/search-archive.service';
import { OpenTelemetryTracer } from '../src/observability/telemetry';
import { PrometheusMetricsExporter } from '../src/observability/prometheus';

describe('Fase 5: Integraciones Externas, DevOps y Observabilidad', () => {
  it('Mejora #27: JiraXrayConnector formatea casos para Xray y simula sincronización', async () => {
    const connector = new JiraXrayConnector();
    const payload = connector.formatTestCaseForXray({
      code: 'CP-101',
      title: 'Validación de Retiro',
      type: 'positive',
      priority: 'high',
      expectedResult: 'Dispensar monto solicitado',
      steps: ['Insertar tarjeta', 'Ingresar PIN', 'Seleccionar monto'],
      testData: 'PIN 1234',
    });

    expect(payload.summary).toContain('[CP-101]');
    expect(payload.xrayManualSteps).toHaveLength(3);

    const syncRes = await connector.syncToJira(payload);
    expect(syncRes.success).toBe(true);
    expect(syncRes.issueKey).toMatch(/^QA-\d+/);
  });

  it('Mejora #28: DevOpsGitHubConnector formatea issues de GitHub y Azure Work Items', () => {
    const issue = DevOpsGitHubConnector.formatGitHubIssue({
      code: 'CP-202',
      title: 'Login Fallido por Intentos',
      type: 'negative',
      priority: 'high',
      steps: ['Ingresar clave errónea 3 veces'],
      expectedResult: 'Bloqueo temporal de cuenta',
    });

    expect(issue.title).toContain('[QA-TEST] CP-202');
    expect(issue.labels).toContain('qa');
    expect(issue.body).toContain('Bloqueo temporal de cuenta');

    const azureItem = DevOpsGitHubConnector.formatAzureWorkItem({
      code: 'CP-202',
      title: 'Login Fallido',
      steps: ['Paso 1'],
      expectedResult: 'Resultado 1',
    });
    expect(azureItem[0].value).toContain('[CP-202]');
  });

  it('Mejora #30: GitSyncService parsea requisitos desde Markdown en repositorio', () => {
    const md = `
# [REQ-099] Checkout de Compras Express
## Descripción
> El cliente puede finalizar su compra en un solo clic utilizando datos guardados.
## Criterios de Aceptación
Dado un cliente con tarjeta guardada cuando pulsa Comprar Express entonces se genera la orden en 1 segundo.
`;
    const parsed = GitSyncService.parseMarkdownRequirement(md, 'docs/req-099.md');
    expect(parsed.code).toBe('REQ-099');
    expect(parsed.title).toBe('Checkout de Compras Express');
    expect(parsed.description).toContain('finalizar su compra en un solo clic');
    expect(parsed.acceptanceCriteria).toContain('Dado un cliente con tarjeta guardada');
  });

  it('Mejora #31: TwoFactorService genera y verifica códigos TOTP RFC 6238', () => {
    const { secret, otpAuthUrl } = TwoFactorService.generateSecret('tester@testgenai.io');
    expect(secret).toBeDefined();
    expect(otpAuthUrl).toContain('otpauth://totp');

    // Validación de un código inválido
    expect(TwoFactorService.verifyCode(secret, '000000')).toBe(false);
    expect(TwoFactorService.verifyCode(secret, 'abc')).toBe(false);
  });

  it('Mejora #18 y #19: SearchArchiveService realiza búsqueda FTS ponderada y archivado', () => {
    const mockCases = [
      { id: '1', code: 'CP-001', title: 'Login con Google', expectedResult: 'Acceso concedido', steps: ['clic en login'], status: 'APPROVED' },
      { id: '2', code: 'CP-002', title: 'Pago con Tarjeta Visa', expectedResult: 'Comprobante emitido', steps: ['ingresar visa'], status: 'REJECTED' },
    ];

    const results = SearchArchiveService.searchTestCases(mockCases, 'Google');
    expect(results).toHaveLength(1);
    expect(results[0].item.code).toBe('CP-001');

    const { active, archived } = SearchArchiveService.archiveCases(mockCases);
    expect(active).toHaveLength(1);
    expect(archived).toHaveLength(1);
    expect(archived[0].code).toBe('CP-002');
  });

  it('Mejora #42: OpenTelemetryTracer registra y mide spans distribuidos', () => {
    const tracer = new OpenTelemetryTracer();
    const span = tracer.startSpan('ai_generation_inference', { model: 'gemini-1.5' });
    const completed = span.end('OK');

    expect(completed.name).toBe('ai_generation_inference');
    expect(completed.status).toBe('OK');
    expect(completed.durationMs).toBeGreaterThanOrEqual(0);
    expect(tracer.getCompletedSpans()).toHaveLength(1);
  });

  it('Mejora #43: PrometheusMetricsExporter exporta métricas en formato texto', () => {
    PrometheusMetricsExporter.incCounter('testgenai_generations_total', { provider: 'mock' }, 5);
    PrometheusMetricsExporter.setGauge('testgenai_active_users', 4);

    const prometheusText = PrometheusMetricsExporter.toPrometheusText();
    expect(prometheusText).toContain('testgenai_generations_total{provider="mock"} 5');
    expect(prometheusText).toContain('testgenai_active_users 4');
  });
});
