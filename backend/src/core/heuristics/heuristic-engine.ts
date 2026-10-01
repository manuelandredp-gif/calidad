import { RawGeneratedCase } from '../interfaces/ai-provider.interface';
import { GherkinParser } from './gherkin-parser';
import { DomainTemplates } from './domain-templates';
import { DecisionTableEngine, DecisionTableResult } from './decision-table';
import { StateTransitionEngine, StateTransitionResult } from './state-transition';
import { AmbiguityDetectorISO29148, RequirementQualityReport } from './ambiguity-detector';

export interface HeuristicRuleMatch {
  ruleType:
    | 'BOUNDARY'
    | 'EQUIVALENCE'
    | 'VALIDATION'
    | 'CONDITIONAL'
    | 'BDD_GHERKIN'
    | 'DOMAIN_SECURITY'
    | 'DECISION_TABLE'
    | 'STATE_TRANSITION';
  patternFound: string;
  sourceText: string;
}

export class HeuristicEngine {
  /**
   * Genera casos de prueba deterministas combinando:
   * 1. Parser BDD / Gherkin (Dado-Cuando-Entonces)
   * 2. Análisis de Valores Límite (BVA) y Partición de Equivalencia
   * 3. Arquetipos de Dominio (Seguridad, Inyección, Archivos, Idempotencia)
   * SIN utilizar modelos de lenguaje ni consumir llamadas de red/tokens.
   */
  static generateDeterministicTestCases(
    code: string,
    title: string,
    description: string,
    acceptanceCriteria: string
  ): { cases: RawGeneratedCase[]; rulesMatched: HeuristicRuleMatch[] } {
    const cases: RawGeneratedCase[] = [];
    const rulesMatched: HeuristicRuleMatch[] = [];

    // FÓRMULA 1: Si los criterios contienen sintaxis BDD / Gherkin (Dado-Cuando-Entonces), parsear formalmente
    if (GherkinParser.isGherkinSyntax(acceptanceCriteria)) {
      const bddCases = GherkinParser.parseToTestCases(acceptanceCriteria, title);
      if (bddCases.length > 0) {
        rulesMatched.push({
          ruleType: 'BDD_GHERKIN',
          patternFound: `Estructura BDD/Gherkin detectada (${bddCases.length} escenarios)`,
          sourceText: 'Criterios de aceptación estructurados en formato Dado-Cuando-Entonces',
        });
        cases.push(...bddCases);
      }
    }

    const lines = acceptanceCriteria
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    // 1. Caso Positivo Base (Flujo Principal de Éxito)
    cases.push({
      type: 'positive',
      title: `${title}: Probar que todo funcione bien con los datos correctos`,
      preconditions: [
        'Tener acceso a la pantalla o función correspondiente',
        'Tener los datos preparados para la prueba',
      ],
      steps: [
        `Abrir la pantalla correspondiente de ${title}`,
        'Escribir la información correcta en todos los campos requeridos',
        'Presionar el botón de confirmar o guardar',
      ],
      testData: 'Datos válidos según lo requerido',
      expectedResult: `La acción se procesa correctamente y muestra el resultado esperado: "${description.slice(0, 100)}..."`,
      priority: 'high',
      evidenceStatus: 'derived',
      evidenceText: description.slice(0, 120),
    });

    // 2. Analizador de Reglas sobre Criterios de Aceptación
    for (const line of lines) {
      // Técnica 1: Análisis de Longitud / Caracteres (ej. "al menos 8 caracteres", "mínimo 5")
      const minLengthMatch = line.match(/(?:al menos|mínimo|mayor a|longitud mínima de)\s+(\d+)\s*(?:caracteres|caracter|dígitos)?/i);
      if (minLengthMatch) {
        const minVal = parseInt(minLengthMatch[1], 10);
        rulesMatched.push({
          ruleType: 'BOUNDARY',
          patternFound: `Límite mínimo: ${minVal}`,
          sourceText: line,
        });

        // Caso Límite Exacto
        cases.push({
          type: 'boundary',
          title: `Límite Mínimo: Probar que acepte exactamente la cantidad requerida (${minVal} caracteres)`,
          preconditions: ['Formulario abierto en pantalla'],
          steps: [
            `Escribir un texto de exactamente ${minVal} caracteres`,
            'Completar los demás campos y presionar enviar',
          ],
          testData: `Texto de exactamente ${minVal} caracteres ('${'A'.repeat(minVal)}')`,
          expectedResult: `El sistema acepta el valor correctamente porque cumple con el mínimo de ${minVal} caracteres.`,
          priority: 'high',
          evidenceStatus: 'derived',
          evidenceText: line,
        });

        // Caso Límite Inmediato Inferior (N - 1)
        if (minVal > 1) {
          cases.push({
            type: 'boundary',
            title: `Límite Mínimo: Probar que avise si falta 1 caracter para el mínimo (${minVal - 1} caracteres)`,
            preconditions: ['Formulario abierto en pantalla'],
            steps: [
              `Escribir un texto con ${minVal - 1} caracteres (uno menos del mínimo permitido)`,
              'Intentar guardar o enviar el formulario',
            ],
            testData: `Texto de ${minVal - 1} caracteres ('${'A'.repeat(minVal - 1)}')`,
            expectedResult: `El sistema avisa amigablemente que se necesitan al menos ${minVal} caracteres y no deja continuar.`,
            priority: 'high',
            evidenceStatus: 'derived',
            evidenceText: line,
          });
        }
      }

      // Técnica 2: Análisis de Montos / Cantidades (ej. "mínimo S/ 50", "hasta 100")
      const amountMatch = line.match(/(?:monto mínimo|mínimo|desde|a partir de)\s*(?:S\/\.?|\$)?\s*(\d+(?:\.\d+)?)/i);
      if (amountMatch && !minLengthMatch) {
        const threshold = parseFloat(amountMatch[1]);
        rulesMatched.push({
          ruleType: 'BOUNDARY',
          patternFound: `Umbral numérico: ${threshold}`,
          sourceText: line,
        });

        cases.push({
          type: 'boundary',
          title: `Monto Mínimo: Probar que acepte el monto mínimo exacto ($${threshold})`,
          preconditions: ['Pantalla de operación lista'],
          steps: [
            `Ingresar exactamente ${threshold} en el campo de monto`,
            'Confirmar la operación',
          ],
          testData: `Monto = ${threshold}`,
          expectedResult: `La operación con el monto mínimo ($${threshold}) es aceptada con éxito.`,
          priority: 'high',
          evidenceStatus: 'derived',
          evidenceText: line,
        });

        cases.push({
          type: 'negative',
          title: `Monto Insuficiente: Probar qué sucede si se ingresa un monto menor al mínimo`,
          preconditions: ['Pantalla de operación lista'],
          steps: [
            `Ingresar un monto menor al mínimo (ejemplo: ${threshold > 1 ? threshold - 1 : (threshold * 0.9).toFixed(2)})`,
            'Intentar procesar la operación',
          ],
          testData: `Monto menor = ${threshold > 1 ? threshold - 1 : (threshold * 0.9).toFixed(2)}`,
          expectedResult: `El sistema avisa que el monto ingresado es menor al mínimo requerido y no procesa el pago.`,
          priority: 'medium',
          evidenceStatus: 'derived',
          evidenceText: line,
        });
      }

      // Técnica 3: Reglas de Bloqueo por Intentos Fallidos
      const attemptMatch = line.match(/(?:tras|después de|luego de|alcanzar)\s+(\d+)\s*(?:intentos|veces)?/i);
      if (attemptMatch) {
        const attempts = parseInt(attemptMatch[1], 10);
        rulesMatched.push({
          ruleType: 'CONDITIONAL',
          patternFound: `Límite de reintentos: ${attempts}`,
          sourceText: line,
        });

        cases.push({
          type: 'boundary',
          title: `Bloqueo de Seguridad: Probar que bloquee la cuenta tras ${attempts} intentos fallidos seguidos`,
          preconditions: [`Usuario con ${attempts - 1} intentos fallidos previos`],
          steps: [
            `Ingresar datos incorrectos por ${attempts}ª vez consecutiva`,
            'Observar qué respuesta muestra el sistema',
          ],
          testData: `${attempts} fallos consecutivos`,
          expectedResult: `El sistema bloquea temporalmente el acceso y muestra el aviso de seguridad: "${line}"`,
          priority: 'high',
          evidenceStatus: 'derived',
          evidenceText: line,
        });
      }

      // Técnica 4: Prohibiciones o Reglas de Restricción
      if (/no se permite|no se puede|no debe|inválido|expirado|erróneo/i.test(line)) {
        rulesMatched.push({
          ruleType: 'VALIDATION',
          patternFound: 'Restricción negativa explícita',
          sourceText: line,
        });

        cases.push({
          type: 'negative',
          title: `Regla de Negocio: Probar qué sucede ante: "${line.slice(0, 60)}..."`,
          preconditions: ['Sistema listo para probar'],
          steps: [
            'Probar la acción o situación no permitida por la regla',
            'Comprobar que el sistema impida la acción adecuadamente',
          ],
          testData: 'Datos que no cumplen la regla',
          expectedResult: `El sistema detecta la situación y responde según la regla: "${line}"`,
          priority: 'medium',
          evidenceStatus: 'derived',
          evidenceText: line,
        });
      }
    }

    // 3. Casos de Validación Estándar de Integridad (Campos Vacíos y Formatos)
    if (/correo|email/i.test(description) || /correo|email/i.test(acceptanceCriteria)) {
      cases.push({
        type: 'validation',
        title: 'Validación de Correo: Probar qué pasa si se escribe un correo sin @ o incompleto',
        preconditions: ['Formulario con campo de correo visible'],
        steps: [
          'Escribir un correo sin el símbolo @ o sin punto (ejemplo: "usuario_invalido")',
          'Intentar enviar el formulario',
        ],
        testData: 'correo = "correo_sin_arroba.com"',
        expectedResult: 'El sistema resalta el campo de correo y avisa que el formato es incorrecto.',
        priority: 'medium',
        evidenceStatus: 'derived',
        evidenceText: 'Validación de correo electrónico.',
      });
    }

    cases.push({
      type: 'validation',
      title: 'Campos Vacíos: Probar qué pasa si se intenta enviar el formulario en blanco',
      preconditions: ['Formulario limpio en pantalla'],
      steps: [
        'Dejar los campos obligatorios en blanco',
        'Presionar el botón de enviar o guardar',
      ],
      testData: 'Campos sin llenar (vacíos)',
      expectedResult: 'El sistema no deja enviar el formulario y resalta los campos obligatorios que faltan completar.',
      priority: 'medium',
      evidenceStatus: 'derived',
      evidenceText: 'Validación de campos obligatorios.',
    });

    // FÓRMULA 2: Detección de Arquetipo de Dominio (Seguridad, Pagos, CRUD, Archivos)
    const combinedContent = `${title} ${description} ${acceptanceCriteria}`;
    const archetype = DomainTemplates.detectArchetype(combinedContent);
    if (archetype !== 'GENERAL') {
      const domainCases = DomainTemplates.getArchetypeCases(archetype, code, title);
      if (domainCases.length > 0) {
        rulesMatched.push({
          ruleType: 'DOMAIN_SECURITY',
          patternFound: `Arquetipo de Dominio detectado: ${archetype}`,
          sourceText: `Casos canónicos de pruebas e integridad para ${archetype}`,
        });
        cases.push(...domainCases);
      }
    }

    return { cases, rulesMatched };
  }

  /**
   * Genera casos mediante Tablas de Decisión ISTQB (Mejora #11).
   */
  static generateDecisionTable(title: string, acceptanceCriteria: string): DecisionTableResult {
    return DecisionTableEngine.parseTextToDecisionTable(title, acceptanceCriteria);
  }

  /**
   * Genera casos mediante Máquinas de Transición de Estados ISTQB (Mejora #12).
   */
  static generateStateTransitions(title: string, text: string): StateTransitionResult {
    return StateTransitionEngine.parseFromText(title, text);
  }

  /**
   * Analiza ambigüedad y calidad de requisitos según ISO/IEC/IEEE 29148 (Mejora #15).
   */
  static analyzeRequirementQuality(
    description: string,
    acceptanceCriteria: string
  ): RequirementQualityReport {
    return AmbiguityDetectorISO29148.analyze(description, acceptanceCriteria);
  }
}

