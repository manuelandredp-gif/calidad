export interface HallucinationEvaluation {
  faithfulnessScore: number; // 0 (alucinación total) - 100 (fidelidad absoluta al requisito)
  hallucinationRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  answerRelevanceScore: number; // 0 - 100
  ungroundedClaims: string[];
  explanation: string;
}

export class HallucinationMetrics {
  /**
   * Evalúa la fidelidad cuantitativa de los casos generados contra el texto del requisito base (Mejora #9).
   */
  static evaluateCase(
    sourceRequirementText: string,
    testCaseTitle: string,
    expectedResult: string,
    steps: string[]
  ): HallucinationEvaluation {
    const sourceTokens = this._extractKeyTokens(sourceRequirementText);
    const caseText = `${testCaseTitle} ${expectedResult} ${steps.join(' ')}`;
    const caseTokens = this._extractKeyTokens(caseText);

    const ungroundedClaims: string[] = [];

    // Detectar entidades o términos en el caso que no guardan relación alguna con el requisito
    caseTokens.forEach((token) => {
      // Excluir términos de testing estándar
      const isTestingStopword = /^(sistema|usuario|pantalla|botón|boton|campo|clic|click|verificar|validar|esperar|formulario|mensaje|código|codigo|prueba|paso|datos|ingresar|correcto|válido|valido|queda|debe|mostrar|acceder|cuenta|éxito|exitoso|resultado|estado)$/i.test(
        token
      );
      if (isTestingStopword) return;

      // Verificar si coincide o comparte raíz léxica con tokens del requisito (mínimo 4 caracteres)
      const rootMatch = Array.from(sourceTokens).some(
        (src) => src.startsWith(token.slice(0, 4)) || token.startsWith(src.slice(0, 4))
      );

      if (!rootMatch) {
        ungroundedClaims.push(token);
      }
    });

    // Calcular proporción de fidelidad
    const totalKeyTokens = caseTokens.size;
    const groundedCount = totalKeyTokens - Math.min(totalKeyTokens, ungroundedClaims.length);
    const faithfulnessScore =
      totalKeyTokens > 0 ? Math.round((groundedCount / totalKeyTokens) * 100) : 100;


    let hallucinationRisk: HallucinationEvaluation['hallucinationRisk'];
    if (faithfulnessScore >= 75) hallucinationRisk = 'LOW';
    else if (faithfulnessScore >= 50) hallucinationRisk = 'MEDIUM';
    else hallucinationRisk = 'HIGH';

    const relevanceScore = Math.min(100, Math.round(faithfulnessScore * 0.8 + 20));

    const explanation =
      hallucinationRisk === 'LOW'
        ? 'El caso de prueba está sólidamente fundamentado en los términos y reglas del requisito.'
        : hallucinationRisk === 'MEDIUM'
        ? `Se detectaron posibles inferencias o términos no explícitos en el requisito (${ungroundedClaims.slice(0, 3).join(', ')}).`
        : `Alto riesgo de alucinación: múltiples elementos no tienen sustento en el requisito (${ungroundedClaims.slice(0, 4).join(', ')}).`;

    return {
      faithfulnessScore,
      hallucinationRisk,
      answerRelevanceScore: relevanceScore,
      ungroundedClaims: ungroundedClaims.slice(0, 5),
      explanation,
    };
  }

  private static _extractKeyTokens(text: string): Set<string> {
    const words = (text || '')
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 3);
    return new Set(words);
  }
}
