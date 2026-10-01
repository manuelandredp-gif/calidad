import { RawGeneratedCase } from '../interfaces/ai-provider.interface';

export interface DecisionCondition {
  id: string;
  name: string;
  values: string[]; // e.g. ['True', 'False'] or ['< 18', '18-65', '> 65']
}

export interface DecisionAction {
  id: string;
  name: string;
  expectedOutcome: string;
}

export interface DecisionRule {
  ruleId: string;
  conditionValues: Record<string, string>;
  actionValues: Record<string, boolean>;
  description: string;
}

export interface DecisionTableResult {
  title: string;
  conditions: DecisionCondition[];
  actions: DecisionAction[];
  rules: DecisionRule[];
  cases: RawGeneratedCase[];
}

export class DecisionTableEngine {
  /**
   * Genera una tabla de decisión formal y sus casos de prueba asociados según el estándar ISTQB.
   */
  static generateFromConditionsAndActions(
    featureTitle: string,
    conditions: DecisionCondition[],
    actions: DecisionAction[],
    ruleEvaluator?: (combination: Record<string, string>) => {
      actionValues: Record<string, boolean>;
      expectedDescription: string;
    }
  ): DecisionTableResult {
    if (conditions.length === 0) {
      return {
        title: featureTitle,
        conditions: [],
        actions: [],
        rules: [],
        cases: [],
      };
    }

    // Generar el producto cartesiano de combinaciones de condiciones
    const combinations = this.cartesianProduct(
      conditions.map((c) => c.values.map((v) => ({ conditionId: c.id, value: v })))
    );

    const rules: DecisionRule[] = [];
    const cases: RawGeneratedCase[] = [];

    combinations.forEach((comboList, index) => {
      const conditionMap: Record<string, string> = {};
      comboList.forEach((c) => {
        conditionMap[c.conditionId] = c.value;
      });

      const ruleId = `R${index + 1}`;

      let actionValues: Record<string, boolean> = {};
      let expectedOutcome = '';

      if (ruleEvaluator) {
        const evaluated = ruleEvaluator(conditionMap);
        actionValues = evaluated.actionValues;
        expectedOutcome = evaluated.expectedDescription;
      } else {
        // Evaluador heurístico por defecto
        const hasNegative = Object.values(conditionMap).some(
          (v) =>
            v.toLowerCase().includes('false') ||
            v.toLowerCase().includes('no') ||
            v.toLowerCase().includes('inválido') ||
            v.toLowerCase().includes('invalido')
        );

        actions.forEach((act, aIdx) => {
          if (aIdx === 0) {
            actionValues[act.id] = !hasNegative;
          } else {
            actionValues[act.id] = hasNegative;
          }
        });

        expectedOutcome = !hasNegative
          ? (actions[0]?.expectedOutcome || 'Operación permitida y procesada con éxito')
          : (actions[1]?.expectedOutcome || 'Operación denegada con mensaje de validación correspondiente');
      }

      const conditionSummary = Object.entries(conditionMap)
        .map(([cId, val]) => {
          const condName = conditions.find((c) => c.id === cId)?.name || cId;
          return `${condName}=${val}`;
        })
        .join(', ');

      const rule: DecisionRule = {
        ruleId,
        conditionValues: conditionMap,
        actionValues,
        description: `Regla ${ruleId}: [${conditionSummary}] => ${expectedOutcome}`,
      };
      rules.push(rule);

      const isPositive = !Object.values(conditionMap).some(
        (v) =>
          v.toLowerCase().includes('false') ||
          v.toLowerCase().includes('no') ||
          v.toLowerCase().includes('inválido') ||
          v.toLowerCase().includes('invalido')
      );

      cases.push({
        type: isPositive ? 'positive' : 'negative',
        title: `[Tabla de Decisión ${ruleId}] ${featureTitle} - ${conditionSummary}`,
        preconditions: [
          `El sistema está listo para evaluar las reglas de negocio de ${featureTitle}`,
          `Entorno configurado para combinatoria de parámetros: ${conditionSummary}`,
        ],
        steps: [
          `Ingresar al módulo de validación de ${featureTitle}`,
          ...Object.entries(conditionMap).map(([cId, val]) => {
            const condName = conditions.find((c) => c.id === cId)?.name || cId;
            return `Configurar o suministrar condición "${condName}" con valor "${val}"`;
          }),
          'Ejecutar la validación o enviar el formulario',
        ],
        testData: JSON.stringify(conditionMap),
        expectedResult: expectedOutcome,
        priority: isPositive ? 'high' : 'medium',
        evidenceStatus: 'derived',
        evidenceText: `Regla derivada de Tabla de Decisión ISTQB ${ruleId}: ${conditionSummary}`,
      });
    });

    return {
      title: featureTitle,
      conditions,
      actions,
      rules,
      cases,
    };
  }

  /**
   * Infiere automáticamente condiciones y acciones a partir de un texto de criterios de aceptación.
   */
  static parseTextToDecisionTable(
    featureTitle: string,
    acceptanceCriteria: string
  ): DecisionTableResult {
    const lines = acceptanceCriteria
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const conditions: DecisionCondition[] = [];
    const actions: DecisionAction[] = [];

    let condCount = 1;
    for (const line of lines) {
      const matchIf = line.match(/(?:si|cuando|en caso de que)\s+([^,;.]+)/i);
      if (matchIf && conditions.length < 4) {
        conditions.push({
          id: `C${condCount}`,
          name: matchIf[1].trim(),
          values: ['Válido / Sí', 'Inválido / No'],
        });
        condCount++;
      }

      const matchThen = line.match(/(?:entonces|debe|el sistema deber[aá]|permitir|rechazar)\s+([^,;.]+)/i);
      if (matchThen && actions.length < 3) {
        actions.push({
          id: `A${actions.length + 1}`,
          name: matchThen[1].trim(),
          expectedOutcome: line,
        });
      }
    }

    if (conditions.length === 0) {
      conditions.push(
        { id: 'C1', name: 'Credenciales o Datos de Entrada', values: ['Válido', 'Inválido'] },
        { id: 'C2', name: 'Permisos de Usuario', values: ['Autorizado', 'No Autorizado'] }
      );
    }

    if (actions.length === 0) {
      actions.push(
        { id: 'A1', name: 'Aprobar Operación', expectedOutcome: 'Procesamiento exitoso con código 200' },
        { id: 'A2', name: 'Rechazar Operación', expectedOutcome: 'Mensaje de error y rechazo de la transacción' }
      );
    }

    return this.generateFromConditionsAndActions(featureTitle, conditions, actions);
  }

  private static cartesianProduct<T>(arrays: T[][]): T[][] {
    return arrays.reduce<T[][]>(
      (acc, curr) => acc.flatMap((a) => curr.map((c) => [...a, c])),
      [[]]
    );
  }
}
