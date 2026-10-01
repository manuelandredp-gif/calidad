// ==============================================================================
// Infrastructure: OutgoingWebhookService (Mejora 64)
// Notificaciones salientes asíncronas para Slack, Discord o Microsoft Teams.
// ==============================================================================

import { logger } from '../../common/utils/logger';

export interface WebhookEventPayload {
  event: 'REQUIREMENT_APPROVED_100' | 'TEST_RUN_COMPLETED' | 'DEFECT_LOGGED';
  projectId: string;
  projectName: string;
  summary: string;
  details: Record<string, unknown>;
  timestamp: string;
}

export class OutgoingWebhookService {
  /**
   * Envía un webhook con reintento y control de tiempo de espera.
   */
  public static async dispatch(url: string, payload: WebhookEventPayload): Promise<boolean> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'TestGenAI-Platform-Webhook/1.0',
        },
        body: JSON.stringify({
          text: `🔔 [TestGenAI] ${payload.summary}`,
          ...payload,
        }),
        signal: AbortSignal.timeout(5000), // 5 segundos max
      });

      if (!response.ok) {
        logger.warn({ status: response.status, url }, 'Webhook saliente respondió con código no exitoso');
        return false;
      }

      logger.info({ event: payload.event, url }, 'Webhook saliente despachado exitosamente');
      return true;
    } catch (err) {
      logger.error({ err, url }, 'Fallo al despachar webhook saliente');
      return false;
    }
  }
}
