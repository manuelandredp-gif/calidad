import { RawGeneratedCase } from '../core/interfaces/ai-provider.interface';

export interface TreeClass {
  id: string;
  name: string;
  isValid: boolean;
  sampleValue: string;
}

export interface ClassificationAspect {
  id: string;
  name: string;
  classes: TreeClass[];
}

export interface ClassificationTreeResult {
  treeTitle: string;
  aspects: ClassificationAspect[];
  testCasesCount: number;
  cases: RawGeneratedCase[];
}

export class ClassificationTreeEngine {
  /**
   * Genera especificaciones de prueba mediante el Método del Árbol de Clasificación (CTM) ISTQB (Mejora #14).
   */
  static generateCases(
    treeTitle: string,
    aspects: ClassificationAspect[]
  ): ClassificationTreeResult {
    if (aspects.length === 0) {
      return {
        treeTitle,
        aspects: [],
        testCasesCount: 0,
        cases: [],
      };
    }

    const cases: RawGeneratedCase[] = [];

    // 1. Caso Base Nominal Válido (selecciona la primera clase válida de cada clasificación)
    const baseValidClasses: Record<string, TreeClass> = {};
    aspects.forEach((asp) => {
      const validClass = asp.classes.find((c) => c.isValid) || asp.classes[0];
      baseValidClasses[asp.name] = validClass;
    });

    const baseSummary = Object.entries(baseValidClasses)
      .map(([asp, cl]) => `${asp}: [${cl.name}]`)
      .join(', ');

    cases.push({
      type: 'positive',
      title: `[Árbol CTM Nominal] Configuración Canónica para ${treeTitle}`,
      preconditions: [
        `El sistema está listo para procesar la entidad '${treeTitle}'`,
        `Combinación de clases canónicas: ${baseSummary}`,
      ],
      steps: [
        `Ingresar al módulo '${treeTitle}'`,
        ...Object.entries(baseValidClasses).map(
          ([asp, cl]) => `Suministrar clase válida para '${asp}': "${cl.sampleValue}" (${cl.name})`
        ),
        'Confirmar y procesar la operación',
      ],
      testData: JSON.stringify(baseValidClasses),
      expectedResult: `El sistema valida y aprueba la operación sin errores para la combinación canónica: ${baseSummary}.`,
      priority: 'high',
      evidenceStatus: 'derived',
      evidenceText: 'Técnica ISTQB Classification Tree Method (Caso Base Nominal)',
    });

    // 2. Variaciones de Clases Válidas alternativas (one-at-a-time)
    let altCount = 0;
    aspects.forEach((asp) => {
      const otherValidClasses = asp.classes.filter((c) => c.isValid && c.id !== baseValidClasses[asp.name]?.id);
      otherValidClasses.forEach((cl) => {
        altCount++;
        cases.push({
          type: 'positive',
          title: `[Árbol CTM Variante ${altCount}] Variación en ${asp} -> ${cl.name}`,
          preconditions: [`Sistema operativo para '${treeTitle}'`],
          steps: [
            `Configurar parámetro '${asp}' con la clase variante '${cl.name}' (valor: "${cl.sampleValue}")`,
            'Mantener el resto de aspectos en sus valores canónicos válidos',
            'Procesar la solicitud',
          ],
          testData: `Aspecto variado: ${asp}=${cl.sampleValue}`,
          expectedResult: `La transacción se procesa conforme a las reglas particulares de la clase '${cl.name}'.`,
          priority: 'medium',
          evidenceStatus: 'derived',
          evidenceText: `Variación de árbol CTM (${asp})`,
        });
      });
    });

    // 3. Pruebas Negativas de Clases Inválidas (Exactamente una clase inválida por prueba)
    let invalidCount = 0;
    aspects.forEach((asp) => {
      const invalidClasses = asp.classes.filter((c) => !c.isValid);
      invalidClasses.forEach((cl) => {
        invalidCount++;
        cases.push({
          type: 'negative',
          title: `[Árbol CTM Rechazo ${invalidCount}] Violación en ${asp} -> ${cl.name}`,
          preconditions: [
            `Módulo '${treeTitle}' con validación de fronteras activa`,
            'Aislar una única violación por caso de prueba para evitar masking de defectos',
          ],
          steps: [
            `Suministrar valor inválido para '${asp}': "${cl.sampleValue}" (${cl.name})`,
            'Mantener todos los demás aspectos con clases válidas',
            'Intentar procesar la operación',
          ],
          testData: `Valor erróneo: ${asp} = "${cl.sampleValue}"`,
          expectedResult: `El sistema rechaza la operación debido a la clase inválida en '${asp}' y emite un mensaje de error descriptivo sin alterar el estado del sistema.`,
          priority: 'high',
          evidenceStatus: 'derived',
          evidenceText: `Técnica ISTQB CTM de Clases Inválidas (${asp}: ${cl.name})`,
        });
      });
    });

    return {
      treeTitle,
      aspects,
      testCasesCount: cases.length,
      cases,
    };
  }
}
