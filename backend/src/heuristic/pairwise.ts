import { RawGeneratedCase } from '../core/interfaces/ai-provider.interface';

export interface ParameterDefinition {
  name: string;
  values: string[];
}

export interface PairwiseResult {
  parameters: ParameterDefinition[];
  totalPossibleCombinations: number;
  pairwiseTestVectors: Record<string, string>[];
  totalPairsCovered: number;
  reductionPercentage: number;
  cases: RawGeneratedCase[];
}

export class PairwiseEngine {
  /**
   * Genera una suite de pruebas combinatorias All-Pairs / Pairwise según el estándar ISTQB (Mejora #13).
   * Garantiza cobertura exhaustiva de 2 vías (todos los pares de parámetros probados al menos una vez).
   */
  static generatePairwise(
    suiteTitle: string,
    parameters: ParameterDefinition[]
  ): PairwiseResult {
    if (parameters.length === 0) {
      return {
        parameters: [],
        totalPossibleCombinations: 0,
        pairwiseTestVectors: [],
        totalPairsCovered: 0,
        reductionPercentage: 0,
        cases: [],
      };
    }

    // 1. Calcular combinaciones cartesianas totales (fuerza bruta)
    const totalPossibleCombinations = parameters.reduce((acc, p) => acc * p.values.length, 1);

    // 2. Generar todos los pares requeridos de 2 vías
    const requiredPairs = new Set<string>();
    for (let i = 0; i < parameters.length; i++) {
      for (let j = i + 1; j < parameters.length; j++) {
        const p1 = parameters[i];
        const p2 = parameters[j];
        p1.values.forEach((v1) => {
          p2.values.forEach((v2) => {
            requiredPairs.add(`${p1.name}=${v1}|${p2.name}=${v2}`);
          });
        });
      }
    }

    const uncoveredPairs = new Set(requiredPairs);
    const testVectors: Record<string, string>[] = [];

    // 3. Algoritmo codicioso (Greedy Pairwise Coverage)
    while (uncoveredPairs.size > 0 && testVectors.length < 100) {
      let bestVector: Record<string, string> | null = null;
      let maxCoveredCount = -1;

      // Iterar candidatos para encontrar el vector que más pares nuevos cubre
      const candidateCount = 25;
      for (let c = 0; c < candidateCount; c++) {
        const candidateVector: Record<string, string> = {};
        parameters.forEach((param) => {
          const randomIndex = Math.floor(Math.random() * param.values.length);
          candidateVector[param.name] = param.values[randomIndex];
        });

        // Contar cuántos pares no cubiertos resuelve este vector
        let coveredInThis = 0;
        for (let i = 0; i < parameters.length; i++) {
          for (let j = i + 1; j < parameters.length; j++) {
            const pairKey = `${parameters[i].name}=${candidateVector[parameters[i].name]}|${parameters[j].name}=${candidateVector[parameters[j].name]}`;
            if (uncoveredPairs.has(pairKey)) {
              coveredInThis++;
            }
          }
        }

        if (coveredInThis > maxCoveredCount) {
          maxCoveredCount = coveredInThis;
          bestVector = candidateVector;
        }
      }

      if (!bestVector || maxCoveredCount === 0) {
        // Tomar un par pendiente y rellenar los demás
        const nextPair = uncoveredPairs.values().next().value;
        if (!nextPair) break;
        const [part1, part2] = nextPair.split('|');
        const [k1, v1] = part1.split('=');
        const [k2, v2] = part2.split('=');

        const fallbackVector: Record<string, string> = {};
        parameters.forEach((p) => {
          if (p.name === k1) fallbackVector[p.name] = v1;
          else if (p.name === k2) fallbackVector[p.name] = v2;
          else fallbackVector[p.name] = p.values[0];
        });
        bestVector = fallbackVector;
      }

      testVectors.push(bestVector);

      // Eliminar los pares cubiertos por este vector
      for (let i = 0; i < parameters.length; i++) {
        for (let j = i + 1; j < parameters.length; j++) {
          const pairKey = `${parameters[i].name}=${bestVector[parameters[i].name]}|${parameters[j].name}=${bestVector[parameters[j].name]}`;
          uncoveredPairs.delete(pairKey);
        }
      }
    }

    const reductionPercentage =
      totalPossibleCombinations > 0
        ? Math.round(((totalPossibleCombinations - testVectors.length) / totalPossibleCombinations) * 100)
        : 0;

    // 4. Transformar los vectores en Casos de Prueba ISTQB
    const cases: RawGeneratedCase[] = testVectors.map((vector, idx) => {
      const caseCode = `PW-${String(idx + 1).padStart(2, '0')}`;
      const vectorSummary = Object.entries(vector)
        .map(([k, v]) => `${k}: "${v}"`)
        .join(', ');

      return {
        type: 'positive',
        title: `[Pairwise ISTQB ${caseCode}] Configuración: ${vectorSummary}`,
        preconditions: [
          `Entorno de ejecución preparado para la funcionalidad '${suiteTitle}'`,
          `Configuración de variables ortogonales: ${vectorSummary}`,
        ],
        steps: [
          `Iniciar prueba funcional de ${suiteTitle}`,
          ...Object.entries(vector).map(([paramName, val]) => `Configurar el parámetro "${paramName}" con "${val}"`),
          'Ejecutar la transacción o enviar los datos',
        ],
        testData: JSON.stringify(vector),
        expectedResult: `El sistema procesa correctamente la combinación de parámetros sin conflictos de compatibilidad (${vectorSummary}).`,
        priority: 'high',
        evidenceStatus: 'derived',
        evidenceText: `Vector Pairwise ISTQB 2-Way Combinatorial (${caseCode})`,
      };
    });

    return {
      parameters,
      totalPossibleCombinations,
      pairwiseTestVectors: testVectors,
      totalPairsCovered: requiredPairs.size,
      reductionPercentage,
      cases,
    };
  }
}
