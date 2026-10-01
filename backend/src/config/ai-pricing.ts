export interface ModelPricing {
  inputPerMillion: number;
  outputPerMillion: number;
}

export const AI_PRICING_TABLE: Record<string, ModelPricing> = {
  // Modelos de Google Gemini (Precios oficiales por millón de tokens)
  'gemini-2.5-flash-lite': { inputPerMillion: 0.10, outputPerMillion: 0.40 },
  'gemini-1.5-flash': { inputPerMillion: 0.075, outputPerMillion: 0.30 },
  'gemini-1.5-pro': { inputPerMillion: 1.25, outputPerMillion: 5.00 },

  // Modelos de OpenAI (Precios oficiales por millón de tokens)
  'gpt-5-nano': { inputPerMillion: 0.05, outputPerMillion: 0.40 },
  'gpt-4o-mini': { inputPerMillion: 0.15, outputPerMillion: 0.60 },
  'gpt-4o': { inputPerMillion: 2.50, outputPerMillion: 10.00 },

  // Adaptador Mock de prueba académica (sin costo)
  'mock-istqb-v1': { inputPerMillion: 0.0, outputPerMillion: 0.0 },
};

/**
 * Calcula el costo monetario en USD de una inferencia con IA en función de los tokens de entrada y salida.
 */
export function calculateAICost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = AI_PRICING_TABLE[model] || { inputPerMillion: 0.10, outputPerMillion: 0.40 };
  const inputCost = (inputTokens / 1_000_000) * pricing.inputPerMillion;
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPerMillion;
  const total = inputCost + outputCost;
  // Redondeo a 6 decimales para precisión de micro-dólares
  return Math.round(total * 1_000_000) / 1_000_000;
}
