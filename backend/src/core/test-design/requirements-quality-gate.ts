// ==========================================================================
// Core Domain: RequirementsQualityGate
// Linter Estático Determinista de Requisitos según ISO/IEC/IEEE 29119-3 y EARS
// Evalúa Testability Score, detecta ambigüedad léxica y recomienda técnica ISTQB
// ==========================================================================

export interface AmbiguityMatch {
  term: string;
  category: 'subjective_adjective' | 'vague_adverb' | 'open_clause' | 'non_verifiable';
  suggestion: string;
  foundIn: 'title' | 'description' | 'acceptanceCriteria';
}

export interface QualityGateEvaluation {
  testabilityScore: number; // 0 a 100
  testabilityLevel: 'EXCELLENT' | 'GOOD' | 'NEEDS_IMPROVEMENT' | 'POOR';
  recommendedTechnique: {
    key: 'BVA' | 'DECISION_TABLE' | 'STATE_TRANSITION' | 'EQUIVALENCE_PARTITIONING' | 'TEMPLATE';
    name: string;
    rationale: string;
  };
  syntaxAnalysis: {
    hasActor: boolean;
    hasAction: boolean;
    hasOutcome: boolean;
    hasGivenWhenThen: boolean;
    hasQuantitativeCriteria: boolean;
  };
  ambiguities: AmbiguityMatch[];
  strengths: string[];
  improvements: string[];
}

export class RequirementsQualityGate {
  private static readonly VAGUE_TERMS_CATALOG: Array<{
    regex: RegExp;
    term: string;
    category: AmbiguityMatch['category'];
    suggestion: string;
  }> = [
    {
      regex: /\b(r[aá]pido|inmediato|al instante|sin demora)\b/gi,
      term: 'rápido/inmediato',
      category: 'subjective_adjective',
      suggestion: 'Especificar el umbral cuantitativo exacto en milisegundos o segundos (ej. "en menos de 1.5s").',
    },
    {
      regex: /\b(f[aá]cil|sencillo|simple|amigable|intuitivo)\b/gi,
      term: 'fácil/amigable/intuitivo',
      category: 'subjective_adjective',
      suggestion: 'Describir el comportamiento funcional verificable (ej. "el flujo se completa en 3 pasos obligatorios").',
    },
    {
      regex: /\b([oó]ptimo|adecuado|apropiado|decente)\b/gi,
      term: 'óptimo/adecuado',
      category: 'subjective_adjective',
      suggestion: 'Definir el criterio de aceptación medible o la regla de negocio que determina la adecuación.',
    },
    {
      regex: /\b(robusto|seguro|alta seguridad)\b/gi,
      term: 'robusto/seguro',
      category: 'non_verifiable',
      suggestion: 'Especificar el estándar de cifrado, protocolo (ej. TLS 1.3, bcrypt coste 12) o política de autenticación.',
    },
    {
      regex: /\b(aproximadamente|cerca de|m[aá]s o menos|alrededor de)\b/gi,
      term: 'aproximadamente/cerca de',
      category: 'vague_adverb',
      suggestion: 'Indicar cotas de rango exactas con tolerancia numérica permitida [Min, Max].',
    },
    {
      regex: /\b(etc[eé]tera|etc\.?|entre otros|y dem[aá]s)\b/gi,
      term: 'etc./entre otros',
      category: 'open_clause',
      suggestion: 'Cerrar la lista exhaustiva de valores o estados permitidos.',
    },
    {
      regex: /\b(en tiempo real|tiempo real)\b/gi,
      term: 'en tiempo real',
      category: 'vague_adverb',
      suggestion: 'Indicar la latencia máxima tolerable (ej. WebSocket con refresco < 500ms).',
    },
    {
      regex: /\b(eficiente|gran capacidad)\b/gi,
      term: 'eficiente/gran capacidad',
      category: 'non_verifiable',
      suggestion: 'Especificar la concurrencia o rendimiento esperado (ej. "soportar 200 req/s").',
    },
  ];

  public static evaluate(requirement: {
    title: string;
    description?: string | null;
    acceptanceCriteria?: string | null;
  }): QualityGateEvaluation {
    const title = requirement.title || '';
    const description = requirement.description || '';
    const criteria = requirement.acceptanceCriteria || '';
    const fullText = `${title} ${description} ${criteria}`;

    // 1. Detección de ambigüedades
    const ambiguities: AmbiguityMatch[] = [];

    const checkText = (text: string, location: AmbiguityMatch['foundIn']) => {
      for (const item of this.VAGUE_TERMS_CATALOG) {
        if (item.regex.test(text)) {
          // Reset regex state
          item.regex.lastIndex = 0;
          ambiguities.push({
            term: item.term,
            category: item.category,
            suggestion: item.suggestion,
            foundIn: location,
          });
        }
      }
    };

    checkText(title, 'title');
    checkText(description, 'description');
    checkText(criteria, 'acceptanceCriteria');

    // 2. Análisis sintáctico y estructural
    const hasGivenWhenThen = /(dado que|given|cuando|when|entonces|then)/i.test(criteria);
    const hasActor = /(como |el usuario|el administrador|el cliente|el sistema)/i.test(fullText);
    const hasAction = /(quiero|debe|permitir|ingresar|seleccionar|calcular|registrar|enviar)/i.test(fullText);
    const hasOutcome = /(para|con el fin de|entonces|se muestra|se genera|retorna|bloquea)/i.test(fullText);
    const hasQuantitativeCriteria = /\b(\d+(\.\d+)?|m[ií]nimo|m[aá]ximo|rango|l[ií]mite|longitud)\b/i.test(fullText);

    // 3. Cálculo ponderado de Testability Score (0 - 100)
    let score = 20; // Puntaje base por registrar el requisito

    // Criterios de Aceptación presentes
    if (criteria.trim().length > 15) score += 20;
    if (hasGivenWhenThen) score += 15;

    // Estructura de historia de usuario / EARS
    if (hasActor && hasAction && hasOutcome) score += 15;

    // Presencia de datos o límites numéricos comprobables
    if (hasQuantitativeCriteria) score += 15;

    // Descripción con detalle suficiente (> 40 caracteres)
    if (description.trim().length > 40) score += 15;

    // Penalización por términos ambiguos (-5 pts por término, max -30)
    const penalty = Math.min(ambiguities.length * 5, 30);
    score = Math.max(0, Math.min(100, score - penalty));

    let testabilityLevel: QualityGateEvaluation['testabilityLevel'] = 'POOR';
    if (score >= 80) testabilityLevel = 'EXCELLENT';
    else if (score >= 65) testabilityLevel = 'GOOD';
    else if (score >= 45) testabilityLevel = 'NEEDS_IMPROVEMENT';

    // 4. Recomendador Algorítmico de Técnica ISTQB
    let recommendedTechnique: QualityGateEvaluation['recommendedTechnique'] = {
      key: 'TEMPLATE',
      name: 'Catálogo de Patrones ISTQB',
      rationale: 'Requisito funcional general; un catálogo estructurado ofrece la mejor línea base.',
    };

    const hasRangeOrNumbers = /\b(monto|edad|precio|cantidad|saldo|m[ií]nimo|m[aá]ximo|entre \d+|caracteres|l[ií]mite)\b/i.test(fullText);
    const hasMultipleConditions = /\b(si\s|en caso de que|siempre que|a menos que|cuando el.*y además|si no)\b/i.test(fullText);
    const hasStateFlow = /\b(estado|transici[oó]n|borrador|aprobado|rechazado|pendiente|activo|inactivo|ciclo de vida)\b/i.test(fullText);

    if (hasRangeOrNumbers) {
      recommendedTechnique = {
        key: 'BVA',
        name: 'Análisis de Valores Límite (BVA) y Partición de Equivalencia',
        rationale: 'Se detectaron variables cuantitativas, límites o rangos. El BVA de 3 puntos asegura cobertura óptima de frontera.',
      };
    } else if (hasMultipleConditions) {
      recommendedTechnique = {
        key: 'DECISION_TABLE',
        name: 'Tablas de Decisión (Decision Table Testing)',
        rationale: 'Se detectaron múltiples combinaciones condicionales (reglas de negocio lógicas si-entonces).',
      };
    } else if (hasStateFlow) {
      recommendedTechnique = {
        key: 'STATE_TRANSITION',
        name: 'Pruebas de Transición de Estados (State Transition)',
        rationale: 'Se detectó mención explícita a flujos de estado del ciclo de vida de la entidad.',
      };
    }

    // 5. Fortalezas y Sugerencias de Mejora
    const strengths: string[] = [];
    const improvements: string[] = [];

    if (hasGivenWhenThen) strengths.push('Criterios de aceptación estructurados en formato BDD (Dado/Cuando/Entonces).');
    if (hasQuantitativeCriteria) strengths.push('Contiene especificaciones cuantitativas concretas y medibles.');
    if (hasActor && hasAction) strengths.push('Claridad en el actor y las acciones principales esperadas.');

    if (!hasGivenWhenThen) improvements.push('Estructurar los criterios en formato Dado-Cuando-Entonces para facilitar la automatización.');
    if (ambiguities.length > 0) {
      improvements.push(`Reemplazar los ${ambiguities.length} términos ambiguos detectados por criterios verificables.`);
    }
    if (!hasQuantitativeCriteria) {
      improvements.push('Especificar longitudes, rangos numéricos o formatos esperados para habilitar pruebas de frontera.');
    }

    return {
      testabilityScore: score,
      testabilityLevel,
      recommendedTechnique,
      syntaxAnalysis: {
        hasActor,
        hasAction,
        hasOutcome,
        hasGivenWhenThen,
        hasQuantitativeCriteria,
      },
      ambiguities,
      strengths,
      improvements,
    };
  }
}
