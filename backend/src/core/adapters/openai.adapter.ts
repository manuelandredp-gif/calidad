import {
  IAIProvider,
  AIGenerationResult,
  RawGeneratedCase,
  GenerateOptions,
} from '../interfaces/ai-provider.interface';
import { calculateAICost } from '../../config/ai-pricing';
import { buildPromptForRequirement } from '../prompts/prompt-builder';
import { env } from '../../config/env';
import { withRetry } from '../../common/utils/retry';

export class OpenAIAdapter implements IAIProvider {
  readonly providerName = 'openai' as const;

  async generateTestCases(
    requirementCode: string,
    requirementTitle: string,
    description: string,
    acceptanceCriteria: string,
    options?: GenerateOptions
  ): Promise<AIGenerationResult> {
    const apiKey = env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY no está configurada en el archivo .env del backend.');
    }

    const modelName = options?.model || 'gpt-4o-mini';
    const { systemPrompt, userPrompt, version } = buildPromptForRequirement(
      requirementCode,
      requirementTitle,
      description,
      acceptanceCriteria
    );

    const startTime = Date.now();

    // Llamada con timeout y reintentos automáticos ante fallos transitorios (5xx / red).
    const response = await withRetry(
      (signal) =>
        fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: modelName,
            response_format: { type: 'json_object' },
            temperature: options?.temperature ?? 0.2,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
          }),
          signal,
        }).then(async (res) => {
          // Reintentamos solo ante errores transitorios; los 4xx se propagan sin reintento.
          if (!res.ok && res.status >= 500) {
            throw new Error(`OpenAI respondió ${res.status} (transitorio)`);
          }
          return res;
        }),
      {
        retries: env.AI_MAX_RETRIES,
        timeoutMs: env.AI_REQUEST_TIMEOUT_MS,
        label: 'OpenAI generateTestCases',
      }
    );

    const responseTimeMs = Date.now() - startTime;

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Error en API de OpenAI (${response.status}): ${errText}`);
    }

    const data = (await response.json()) as {
      usage?: { prompt_tokens: number; completion_tokens: number };
      choices?: Array<{ message?: { content?: string } }>;
    };

    const content = data.choices?.[0]?.message?.content || '{}';
    const parsed = JSON.parse(content) as { cases?: RawGeneratedCase[] };
    const cases = parsed.cases || [];

    const inputTokens = data.usage?.prompt_tokens ?? 0;
    const outputTokens = data.usage?.completion_tokens ?? 0;
    const estimatedCost = calculateAICost(modelName, inputTokens, outputTokens);

    return {
      provider: 'openai',
      model: modelName,
      promptVersion: version,
      inputTokens,
      outputTokens,
      responseTimeMs,
      estimatedCost,
      cases,
    };
  }
}
