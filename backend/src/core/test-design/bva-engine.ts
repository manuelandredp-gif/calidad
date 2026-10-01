// ==========================================================================
// Core Domain: BVAEngine (Boundary Value Analysis & Equivalence Partitioning)
// Motor Algorítmico Determinista basado en ISTQB CTFL v4.0 (Técnicas de Caja Negra)
// ==========================================================================

export type BvaVariableType = 'integer' | 'decimal' | 'string_length';

export interface BvaVariableInput {
  name: string;
  type: BvaVariableType;
  min: number;
  max: number;
  unit?: string;
  decimals?: number; // Por defecto 2 para decimales
}

export interface BvaCalculatedCase {
  type: 'positive' | 'negative' | 'boundary' | 'validation';
  title: string;
  preconditions: string[];
  steps: string[];
  testData: string;
  expectedResult: string;
  priority: 'high' | 'medium' | 'low';
  tag: string;
  testValue: string | number;
}

export class BvaEngine {
  /**
   * Genera casos de prueba formales para una variable aplicando la técnica
   * de Análisis de Valores Límite de 3 puntos (Three-Point BVA) y Partición de Equivalencia.
   */
  public static calculate(variable: BvaVariableInput): BvaCalculatedCase[] {
    const { name, type, min, max, unit = '', decimals = 2 } = variable;

    if (min >= max) {
      throw new Error(`El valor mínimo (${min}) debe ser menor que el valor máximo (${max}) para "${name}".`);
    }

    const cases: BvaCalculatedCase[] = [];
    const unitSuffix = unit ? ` ${unit}` : '';

    if (type === 'string_length') {
      return this.calculateStringLengthBva(variable);
    }

    const step = type === 'decimal' ? parseFloat((1 / Math.pow(10, decimals)).toFixed(decimals)) : 1;

    // 1. Partición de Equivalencia: Valor Nominal Válido
    const nominal = type === 'decimal'
      ? parseFloat(((min + max) / 2).toFixed(decimals))
      : Math.floor((min + max) / 2);

    cases.push({
      type: 'positive',
      title: `[EP] Verificar valor nominal representativo para "${name}" (${nominal}${unitSuffix})`,
      preconditions: [
        'El sistema se encuentra en estado operativo normal.',
        `El usuario tiene acceso al formulario o endpoint que procesa el campo "${name}".`,
      ],
      steps: [
        `1. Ubicar el campo "${name}".`,
        `2. Ingresar el valor nominal válido "${nominal}${unitSuffix}".`,
        '3. Enviar el formulario o ejecutar la acción de validación.',
      ],
      testData: `${name} = ${nominal}${unitSuffix} (Clase de equivalencia válida central)`,
      expectedResult: `El sistema procesa y acepta satisfactoriamente el valor "${nominal}${unitSuffix}" sin advertencias.`,
      priority: 'high',
      tag: 'EP_NOMINAL',
      testValue: nominal,
    });

    // 2. BVA: Límite Inferior Exacto (Min)
    cases.push({
      type: 'boundary',
      title: `[BVA] Verificar límite inferior exacto para "${name}" (${min}${unitSuffix})`,
      preconditions: [
        'El sistema se encuentra en estado operativo normal.',
        `El formulario contiene el campo "${name}" con validación de límite mínimo.`,
      ],
      steps: [
        `1. Ubicar el campo "${name}".`,
        `2. Ingresar el valor frontera mínimo exacto "${min}${unitSuffix}".`,
        '3. Confirmar la operación.',
      ],
      testData: `${name} = ${min}${unitSuffix} (Frontera inferior exacta)`,
      expectedResult: `El sistema valida que el valor "${min}${unitSuffix}" cumple la cota mínima y lo acepta exitosamente.`,
      priority: 'high',
      tag: 'BVA_MIN_EXACT',
      testValue: min,
    });

    // 3. BVA: Justo Arriba del Mínimo (Min + step)
    const justAboveMin = type === 'decimal' ? parseFloat((min + step).toFixed(decimals)) : min + step;
    if (justAboveMin < max) {
      cases.push({
        type: 'boundary',
        title: `[BVA] Verificar valor adyacente superior a la frontera mínima para "${name}" (${justAboveMin}${unitSuffix})`,
        preconditions: ['El sistema se encuentra en estado operativo normal.'],
        steps: [
          `1. Ubicar el campo "${name}".`,
          `2. Ingresar el valor adyacente válido "${justAboveMin}${unitSuffix}".`,
          '3. Confirmar la operación.',
        ],
        testData: `${name} = ${justAboveMin}${unitSuffix} (Frontera inferior + step)`,
        expectedResult: `El sistema acepta correctamente el valor adyacente válido "${justAboveMin}${unitSuffix}".`,
        priority: 'medium',
        tag: 'BVA_MIN_PLUS',
        testValue: justAboveMin,
      });
    }

    // 4. BVA: Límite Superior Exacto (Max)
    cases.push({
      type: 'boundary',
      title: `[BVA] Verificar límite superior exacto para "${name}" (${max}${unitSuffix})`,
      preconditions: [
        'El sistema se encuentra en estado operativo normal.',
        `El formulario contiene el campo "${name}" con validación de cota máxima.`,
      ],
      steps: [
        `1. Ubicar el campo "${name}".`,
        `2. Ingresar el valor frontera máximo exacto "${max}${unitSuffix}".`,
        '3. Confirmar la operación.',
      ],
      testData: `${name} = ${max}${unitSuffix} (Frontera superior exacta)`,
      expectedResult: `El sistema valida que el valor "${max}${unitSuffix}" cumple la cota máxima y lo acepta exitosamente.`,
      priority: 'high',
      tag: 'BVA_MAX_EXACT',
      testValue: max,
    });

    // 5. BVA: Justo Abajo del Máximo (Max - step)
    const justBelowMax = type === 'decimal' ? parseFloat((max - step).toFixed(decimals)) : max - step;
    if (justBelowMax > min) {
      cases.push({
        type: 'boundary',
        title: `[BVA] Verificar valor adyacente inferior a la frontera máxima para "${name}" (${justBelowMax}${unitSuffix})`,
        preconditions: ['El sistema se encuentra en estado operativo normal.'],
        steps: [
          `1. Ubicar el campo "${name}".`,
          `2. Ingresar el valor adyacente válido "${justBelowMax}${unitSuffix}".`,
          '3. Confirmar la operación.',
        ],
        testData: `${name} = ${justBelowMax}${unitSuffix} (Frontera superior - step)`,
        expectedResult: `El sistema acepta correctamente el valor adyacente válido "${justBelowMax}${unitSuffix}".`,
        priority: 'medium',
        tag: 'BVA_MAX_MINUS',
        testValue: justBelowMax,
      });
    }

    // 6. BVA Negativo: Por Debajo del Límite Inferior (Min - step)
    const belowMin = type === 'decimal' ? parseFloat((min - step).toFixed(decimals)) : min - step;
    cases.push({
      type: 'negative',
      title: `[BVA] Verificar rechazo de valor por debajo de la cota mínima para "${name}" (${belowMin}${unitSuffix})`,
      preconditions: ['El sistema se encuentra en estado operativo normal.'],
      steps: [
        `1. Ubicar el campo "${name}".`,
        `2. Ingresar el valor fuera de rango "${belowMin}${unitSuffix}".`,
        '3. Intentar enviar o confirmar.',
      ],
      testData: `${name} = ${belowMin}${unitSuffix} (Clase inválida inferior)`,
      expectedResult: `El sistema bloquea la acción y muestra mensaje de validación: el campo "${name}" debe ser como mínimo ${min}${unitSuffix}.`,
      priority: 'high',
      tag: 'BVA_BELOW_MIN',
      testValue: belowMin,
    });

    // 7. BVA Negativo: Por Encima del Límite Superior (Max + step)
    const aboveMax = type === 'decimal' ? parseFloat((max + step).toFixed(decimals)) : max + step;
    cases.push({
      type: 'negative',
      title: `[BVA] Verificar rechazo de valor por encima de la cota máxima para "${name}" (${aboveMax}${unitSuffix})`,
      preconditions: ['El sistema se encuentra en estado operativo normal.'],
      steps: [
        `1. Ubicar el campo "${name}".`,
        `2. Ingresar el valor excedente "${aboveMax}${unitSuffix}".`,
        '3. Intentar enviar o confirmar.',
      ],
      testData: `${name} = ${aboveMax}${unitSuffix} (Clase inválida superior)`,
      expectedResult: `El sistema bloquea la acción y muestra mensaje de validación: el campo "${name}" no puede exceder ${max}${unitSuffix}.`,
      priority: 'high',
      tag: 'BVA_ABOVE_MAX',
      testValue: aboveMax,
    });

    // 8. Casos Especiales de Validación: Cero y Negativos si min > 0
    if (min > 0) {
      cases.push({
        type: 'validation',
        title: `[Validación] Verificar rechazo de valor cero (0) en "${name}"`,
        preconditions: ['El sistema se encuentra en estado operativo normal.'],
        steps: [
          `1. Ubicar el campo "${name}".`,
          `2. Ingresar el valor numérico 0.`,
          '3. Intentar enviar el formulario.',
        ],
        testData: `${name} = 0 (Valor neutro no permitido)`,
        expectedResult: `El sistema rechaza el valor 0 indicando que se requiere un valor estrictamente mayor o igual a ${min}${unitSuffix}.`,
        priority: 'medium',
        tag: 'BVA_ZERO_SPECIAL',
        testValue: 0,
      });

      cases.push({
        type: 'validation',
        title: `[Validación] Verificar rechazo de valor negativo en "${name}" (-1${unitSuffix})`,
        preconditions: ['El sistema se encuentra en estado operativo normal.'],
        steps: [
          `1. Ubicar el campo "${name}".`,
          `2. Ingresar un valor negativo (-1).`,
          '3. Intentar enviar el formulario.',
        ],
        testData: `${name} = -1${unitSuffix} (Valor negativo en rango estrictamente positivo)`,
        expectedResult: `El sistema impide la entrada de valores negativos y muestra advertencia de validación inmediata.`,
        priority: 'medium',
        tag: 'BVA_NEGATIVE_SPECIAL',
        testValue: -1,
      });
    }

    return cases;
  }

  /**
   * Genera casos de frontera para longitud de cadenas de caracteres (strings).
   */
  private static calculateStringLengthBva(variable: BvaVariableInput): BvaCalculatedCase[] {
    const { name, min, max } = variable;
    const cases: BvaCalculatedCase[] = [];

    const makeString = (len: number, char = 'A') => char.repeat(Math.max(0, len));

    // 1. Nominal
    const nominalLen = Math.floor((min + max) / 2);
    cases.push({
      type: 'positive',
      title: `[EP] Longitud nominal válida para "${name}" (${nominalLen} caracteres)`,
      preconditions: ['El sistema se encuentra disponible.'],
      steps: [
        `1. Ubicar el campo "${name}".`,
        `2. Ingresar texto de longitud válida (${nominalLen} caracteres).`,
        '3. Confirmar la operación.',
      ],
      testData: `Texto de ${nominalLen} caracteres: "${makeString(nominalLen)}"`,
      expectedResult: `El sistema acepta el texto de ${nominalLen} caracteres sin restricciones.`,
      priority: 'high',
      tag: 'EP_STRING_NOMINAL',
      testValue: nominalLen,
    });

    // 2. Límite Mínimo Exacto
    cases.push({
      type: 'boundary',
      title: `[BVA] Longitud mínima exacta para "${name}" (${min} caracteres)`,
      preconditions: ['El sistema se encuentra disponible.'],
      steps: [
        `1. Ubicar el campo "${name}".`,
        `2. Ingresar texto de exactamente ${min} caracteres.`,
        '3. Confirmar la operación.',
      ],
      testData: `Texto de exactamente ${min} caracteres: "${makeString(min)}"`,
      expectedResult: `El sistema acepta el texto en la cota mínima de ${min} caracteres.`,
      priority: 'high',
      tag: 'BVA_STRING_MIN_EXACT',
      testValue: min,
    });

    // 3. Límite Máximo Exacto
    cases.push({
      type: 'boundary',
      title: `[BVA] Longitud máxima exacta para "${name}" (${max} caracteres)`,
      preconditions: ['El sistema se encuentra disponible.'],
      steps: [
        `1. Ubicar el campo "${name}".`,
        `2. Ingresar texto de exactamente ${max} caracteres.`,
        '3. Confirmar la operación.',
      ],
      testData: `Texto de exactamente ${max} caracteres: "${makeString(max)}"`,
      expectedResult: `El sistema acepta el texto en la cota máxima permitida de ${max} caracteres.`,
      priority: 'high',
      tag: 'BVA_STRING_MAX_EXACT',
      testValue: max,
    });

    // 4. Cadena Vacía (Longitud 0) si min > 0
    if (min > 0) {
      cases.push({
        type: 'negative',
        title: `[BVA] Verificar rechazo de campo vacío para "${name}" (0 caracteres)`,
        preconditions: ['El sistema se encuentra disponible.'],
        steps: [
          `1. Ubicar el campo "${name}".`,
          '2. Dejar el campo vacío sin texto alguno (longitud 0).',
          '3. Intentar enviar el formulario.',
        ],
        testData: `Cadena vacía: "" (0 caracteres)`,
        expectedResult: `El sistema bloquea el envío e indica que el campo "${name}" es obligatorio (mínimo ${min} caracteres).`,
        priority: 'high',
        tag: 'BVA_STRING_EMPTY',
        testValue: 0,
      });

      // Menor al mínimo (min - 1)
      if (min > 1) {
        const belowMinLen = min - 1;
        cases.push({
          type: 'negative',
          title: `[BVA] Verificar rechazo de longitud inferior al mínimo para "${name}" (${belowMinLen} caracteres)`,
          preconditions: ['El sistema se encuentra disponible.'],
          steps: [
            `1. Ubicar el campo "${name}".`,
            `2. Ingresar texto de ${belowMinLen} caracteres.`,
            '3. Intentar enviar el formulario.',
          ],
          testData: `Texto de ${belowMinLen} caracteres: "${makeString(belowMinLen)}"`,
          expectedResult: `El sistema rechaza la entrada y solicita un mínimo de ${min} caracteres.`,
          priority: 'high',
          tag: 'BVA_STRING_BELOW_MIN',
          testValue: belowMinLen,
        });
      }
    }

    // 5. Exceso de Longitud (max + 1)
    const aboveMaxLen = max + 1;
    cases.push({
      type: 'negative',
      title: `[BVA] Verificar bloqueo por exceder longitud máxima para "${name}" (${aboveMaxLen} caracteres)`,
      preconditions: ['El sistema se encuentra disponible.'],
      steps: [
        `1. Ubicar el campo "${name}".`,
        `2. Ingresar texto de ${aboveMaxLen} caracteres (1 por encima del límite).`,
        '3. Intentar enviar o verificar si el input trunca automáticamente.',
      ],
      testData: `Texto de ${aboveMaxLen} caracteres: "${makeString(aboveMaxLen)}"`,
      expectedResult: `El sistema impide escribir más de ${max} caracteres o rechaza el envío con mensaje de longitud excedida.`,
      priority: 'high',
      tag: 'BVA_STRING_ABOVE_MAX',
      testValue: aboveMaxLen,
    });

    // 6. Validación Especial: Caracteres especiales Unicode y espacios
    cases.push({
      type: 'validation',
      title: `[Validación] Soporte de caracteres UTF-8 especiales y acentos en "${name}"`,
      preconditions: ['El sistema se encuentra disponible.'],
      steps: [
        `1. Ubicar el campo "${name}".`,
        '2. Ingresar texto con caracteres especiales: "Ñandú pingüino — Áéíóú 🚀".',
        '3. Confirmar la operación.',
      ],
      testData: `Texto: "Ñandú pingüino — Áéíóú 🚀" (Prueba de encoding UTF-8)`,
      expectedResult: `El sistema guarda y recupera los caracteres acentuados y emojis sin corrupción de datos (mojibake).`,
      priority: 'medium',
      tag: 'BVA_STRING_UNICODE',
      testValue: 'UTF-8',
    });

    return cases;
  }
}
