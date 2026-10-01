import { RawGeneratedCase, TestCaseType } from '../interfaces/ai-provider.interface';

export interface GherkinScenario {
  title: string;
  givens: string[];
  whens: string[];
  thens: string[];
  rawText: string;
}

export class GherkinParser {
  /**
   * Determina si el texto de los criterios de aceptación contiene sintaxis BDD / Gherkin
   */
  static isGherkinSyntax(text: string): boolean {
    const gherkinPattern = /(?:dado\s+que|given|cuando|when|entonces|then|escenario:|scenario:)/i;
    return gherkinPattern.test(text);
  }

  /**
   * Analiza sintácticamente un texto BDD / Gherkin (en español o inglés)
   * y deriva casos de prueba formalmente estructurados sin usar IA.
   */
  static parseToTestCases(gherkinText: string, requirementTitle: string): RawGeneratedCase[] {
    const lines = gherkinText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    const scenarios: GherkinScenario[] = [];

    let currentScenario: GherkinScenario = {
      title: '',
      givens: [],
      whens: [],
      thens: [],
      rawText: '',
    };

    let currentClause: 'GIVEN' | 'WHEN' | 'THEN' | null = null;
    let scenarioIndex = 1;

    for (const line of lines) {
      // Detección de encabezado de Escenario
      const scenarioMatch = line.match(/^(?:escenario|scenario):\s*(.+)$/i);
      if (scenarioMatch) {
        if (currentScenario.whens.length > 0 || currentScenario.thens.length > 0) {
          scenarios.push({ ...currentScenario });
        }
        currentScenario = {
          title: scenarioMatch[1],
          givens: [],
          whens: [],
          thens: [],
          rawText: line,
        };
        currentClause = null;
        continue;
      }

      // Detección de Dado / Given
      const givenMatch = line.match(/^(?:dado\s+que|dado|given)\s+(.+)$/i);
      if (givenMatch) {
        currentClause = 'GIVEN';
        currentScenario.givens.push(givenMatch[1]);
        currentScenario.rawText += `\n${line}`;
        continue;
      }

      // Detección de Cuando / When
      const whenMatch = line.match(/^(?:cuando|when)\s+(.+)$/i);
      if (whenMatch) {
        currentClause = 'WHEN';
        currentScenario.whens.push(whenMatch[1]);
        currentScenario.rawText += `\n${line}`;
        continue;
      }

      // Detección de Entonces / Then
      const thenMatch = line.match(/^(?:entonces|then)\s+(.+)$/i);
      if (thenMatch) {
        currentClause = 'THEN';
        currentScenario.thens.push(thenMatch[1]);
        currentScenario.rawText += `\n${line}`;
        continue;
      }

      // Detección de Y / And / Pero / But (continúa la cláusula previa)
      const andMatch = line.match(/^(?:y|and|pero|but)\s+(.+)$/i);
      if (andMatch && currentClause) {
        if (currentClause === 'GIVEN') currentScenario.givens.push(andMatch[1]);
        else if (currentClause === 'WHEN') currentScenario.whens.push(andMatch[1]);
        else if (currentClause === 'THEN') currentScenario.thens.push(andMatch[1]);
        currentScenario.rawText += `\n${line}`;
        continue;
      }

      // Si hay un punto numerado que inicia un bloque de Given/When/Then sin etiqueta "Escenario:"
      if (/^\d+\.\s*(?:dado|given)/i.test(line)) {
        if (currentScenario.whens.length > 0 || currentScenario.thens.length > 0) {
          scenarios.push({ ...currentScenario });
        }
        const cleaned = line.replace(/^\d+\.\s*/, '');
        currentScenario = {
          title: `Criterio BDD #${scenarioIndex++}`,
          givens: [cleaned.replace(/^(?:dado\s+que|dado|given)\s+/i, '')],
          whens: [],
          thens: [],
          rawText: line,
        };
        currentClause = 'GIVEN';
      }
    }

    // Agregar el último escenario procesado
    if (currentScenario.whens.length > 0 || currentScenario.thens.length > 0 || currentScenario.givens.length > 0) {
      if (!currentScenario.title) {
        currentScenario.title = `Escenario BDD para ${requirementTitle}`;
      }
      scenarios.push(currentScenario);
    }

    // Convertir escenarios BDD en casos de prueba canónicos
    return scenarios.map((sc, idx) => {
      const thenText = sc.thens.join(' Y ');
      const title = sc.title || `[BDD] Escenario ${idx + 1} para ${requirementTitle}`;

      // Clasificación del tipo de prueba según el resultado esperado o título
      let type: TestCaseType = 'positive';
      const combinedText = `${title} ${thenText}`.toLowerCase();

      if (/error|rechaz|deniega|bloquea|fallo|inválid|incorrect|expirad/i.test(combinedText)) {
        type = 'negative';
      } else if (/límite|frontera|máximo|mínimo|boundary/i.test(combinedText)) {
        type = 'boundary';
      } else if (/vacío|obligatorio|formato|validaci/i.test(combinedText)) {
        type = 'validation';
      } else if (/alternativ|cancel|otro camino/i.test(combinedText)) {
        type = 'alternative';
      }

      return {
        type,
        title: `[BDD/Gherkin] ${title}`,
        preconditions: sc.givens.length > 0 ? sc.givens : ['Estado estándar del sistema'],
        steps: sc.whens.length > 0 ? sc.whens : ['Ejecutar el flujo según criterio'],
        expectedResult: thenText || 'El sistema responde conforme a la especificación BDD.',
        priority: type === 'positive' || type === 'boundary' ? 'high' : 'medium',
        evidenceStatus: 'derived',
        evidenceText: sc.rawText.trim(),
      };
    });
  }
}
