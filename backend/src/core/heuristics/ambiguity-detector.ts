export interface RequirementQualityIssue {
  ruleId: string;
  category: 'VAGUE_TERM' | 'UNVERIFIABLE' | 'COMPOUND_REQUIREMENT' | 'PASSIVE_VOICE' | 'MISSING_ACTOR';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  snippet: string;
  explanation: string;
  suggestion: string;
}

export interface RequirementQualityReport {
  overallScore: number; // 0 - 100
  rating: 'EXCELLENT' | 'ACCEPTABLE' | 'NEEDS_IMPROVEMENT' | 'CRITICAL_AMBIGUITY';
  metrics: {
    clarity: number; // 0 - 100
    verifiability: number; // 0 - 100
    completeness: number; // 0 - 100
    atomicity: number; // 0 - 100
  };
  detectedIssues: RequirementQualityIssue[];
  suggestions: string[];
}

export class AmbiguityDetectorISO29148 {
  // Lista de términos vagos según el estándar ISO/IEC/IEEE 29148
  private static readonly VAGUE_TERMS = [
    { regex: /\b(f[aá]cil(?:mente)?|sencill[oa]|intuitiv[oa])\b/gi, rule: 'FACILIDAD', explanation: 'Término subjetivo no medible. Especifique métricas de usabilidad o número de clics/pasos permitidos.' },
    { regex: /\b(r[aá]pido|inmediato|lo antes posible|prontamente|alta velocidad)\b/gi, rule: 'RENDIMIENTO_SUBJETIVO', explanation: 'Requisito no verificable. Indique un tiempo máximo en milisegundos o segundos (ej. p95 < 500ms).' },
    { regex: /\b(aproximadamente|alrededor de|cerca de|m[aá]s o menos)\b/gi, rule: 'APROXIMACION', explanation: 'Falta de precisión en valores numéricos. Defina tolerancias exactas o intervalos numéricos cerrados.' },
    { regex: /\b(etc(?:[.]|\b)|entre otr[oa]s|y dem[aá]s|similares)\b/gi, rule: 'LISTA_ABIERTA', explanation: 'Cláusula abierta que oculta alcance no especificado. Liste todos los elementos exhaustivamente.' },
    { regex: /\b(normalmente|generalmente|com[uú]nmente|frecuentemente|a menudo)\b/gi, rule: 'COMPORTAMIENTO_INDEFINIDO', explanation: 'No queda claro qué ocurre en casos excepcionales o cuándo aplica la regla.' },
    { regex: /\b(eficiente|robusto|seguro|amigable|adecuad[oa]|apropiad[oa])\b/gi, rule: 'CALIDAD_NO_MEDIBLE', explanation: 'Calificativo abstracto. Especifique el estándar de cifrado, disponibilidad (ej. 99.9%) o protocolo.' },
    { regex: /\b(debe ser posible|se deber[ií]a poder|podr[ií]a)\b/gi, rule: 'OBLIGATORIEDAD_DEBIL', explanation: 'Verbo condicional débil. Utilice "El sistema debe..." o "El usuario debe...".' },
  ];

  /**
   * Analiza un requisito y sus criterios según ISO 29148.
   */
  static analyze(description: string, acceptanceCriteria: string): RequirementQualityReport {
    const fullText = `${description}\n${acceptanceCriteria}`;
    const issues: RequirementQualityIssue[] = [];

    // 1. Análisis de Términos Vagos (Claridad)
    for (const item of this.VAGUE_TERMS) {
      let match: RegExpExecArray | null;
      while ((match = item.regex.exec(fullText)) !== null) {
        issues.push({
          ruleId: `ISO29148-${item.rule}`,
          category: 'VAGUE_TERM',
          severity: 'HIGH',
          snippet: match[0],
          explanation: item.explanation,
          suggestion: `Reemplazar "${match[0]}" por un criterio cuantitativo o una regla explícita.`,
        });
      }
    }

    // 2. Análisis de Verificabilidad (¿Tiene números, estados o condiciones claras?)
    const hasNumbers = /\d+/.test(fullText);
    const hasAcceptanceStructure = /(?:dado|cuando|entonces|criterio|debe|si|esperado)/i.test(fullText);
    if (!hasNumbers && !hasAcceptanceStructure) {
      issues.push({
        ruleId: 'ISO29148-NO_VERIFIABLE_TARGETS',
        category: 'UNVERIFIABLE',
        severity: 'MEDIUM',
        snippet: description.slice(0, 80),
        explanation: 'El requisito no presenta metas cuantitativas, códigos de error o criterios de aceptación verificables.',
        suggestion: 'Añada valores frontera, límites esperados o códigos de respuesta esperados.',
      });
    }

    // 3. Análisis de Atomicidad (¿Requisito sobrecargado con múltiples "y además", "también", "así como"?)
    const compoundMatches = fullText.match(/\b(y adem[aá]s|as[ií] mismo|tambi[eé]n deber[aá]|por otra parte)\b/gi);
    if (compoundMatches && compoundMatches.length >= 2) {
      issues.push({
        ruleId: 'ISO29148-COMPOUND_REQUIREMENT',
        category: 'COMPOUND_REQUIREMENT',
        severity: 'MEDIUM',
        snippet: compoundMatches.join(', '),
        explanation: 'El texto combina múltiples responsabilidades no atómicas en una sola especificación.',
        suggestion: 'Divida este requisito en historias o requisitos atómicos independientes.',
      });
    }

    // 4. Análisis de Actor / Sujeto explícito
    const hasActor = /(?:usuario|administrador|cliente|sistema|operador|tester|rol|api|servicio)/i.test(fullText);
    if (!hasActor) {
      issues.push({
        ruleId: 'ISO29148-MISSING_ACTOR',
        category: 'MISSING_ACTOR',
        severity: 'LOW',
        snippet: description.slice(0, 60),
        explanation: 'No se identifica con claridad el rol o entidad responsable de ejecutar la acción.',
        suggestion: 'Especifique el rol explícito (ej. "Como Administrador del Sistema, quiero...").',
      });
    }

    // Cálculo de Métricas (0 - 100)
    const clarityPenalties = issues.filter((i) => i.category === 'VAGUE_TERM').length * 25;
    const clarity = Math.max(0, 100 - clarityPenalties);

    const verifiabilityPenalties = issues.filter((i) => i.category === 'UNVERIFIABLE').length * 30;
    const verifiability = Math.max(0, 100 - verifiabilityPenalties);

    const atomicityPenalties = issues.filter((i) => i.category === 'COMPOUND_REQUIREMENT').length * 20;
    const atomicity = Math.max(0, 100 - atomicityPenalties);

    const completenessPenalties = (!hasActor ? 20 : 0) + (acceptanceCriteria.trim().length < 20 ? 30 : 0);
    const completeness = Math.max(0, 100 - completenessPenalties);

    const overallScore = Math.round(
      clarity * 0.4 + verifiability * 0.3 + completeness * 0.15 + atomicity * 0.15
    );


    let rating: RequirementQualityReport['rating'];
    if (overallScore >= 85) rating = 'EXCELLENT';
    else if (overallScore >= 70) rating = 'ACCEPTABLE';
    else if (overallScore >= 50) rating = 'NEEDS_IMPROVEMENT';
    else rating = 'CRITICAL_AMBIGUITY';

    const suggestions: string[] = [];
    if (issues.some((i) => i.category === 'VAGUE_TERM')) {
      suggestions.push('Elimine adjetivos indeterminados ("rápido", "fácil", "etc.") sustituyéndolos por umbrales numéricos medibles.');
    }
    if (issues.some((i) => i.category === 'UNVERIFIABLE')) {
      suggestions.push('Defina criterios en formato BDD (Dado / Cuando / Entonces) para habilitar derivación automática de pruebas.');
    }
    if (issues.some((i) => i.category === 'COMPOUND_REQUIREMENT')) {
      suggestions.push('Separe los criterios en historias de usuario independientes para preservar la atomicidad.');
    }
    if (suggestions.length === 0) {
      suggestions.push('El requisito cumple con los estándares de claridad, verificabilidad y atomicidad de ISO 29148.');
    }

    return {
      overallScore,
      rating,
      metrics: {
        clarity,
        verifiability,
        completeness,
        atomicity,
      },
      detectedIssues: issues,
      suggestions,
    };
  }
}
