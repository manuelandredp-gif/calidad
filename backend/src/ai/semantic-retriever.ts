export interface KnowledgeDocument {
  id: string;
  category: 'SECURITY' | 'PAYMENT' | 'PERFORMANCE' | 'ISTQB_GENERAL';
  title: string;
  content: string;
  keywords: string[];
}

export interface RetrievalResult {
  document: KnowledgeDocument;
  score: number; // 0 - 1
}

export class SemanticQARetriever {
  private documents: KnowledgeDocument[] = [];

  constructor() {
    this._seedDefaultKnowledge();
  }

  /**
   * Agrega un nuevo documento a la base de conocimiento de testing.
   */
  addDocument(doc: KnowledgeDocument): void {
    this.documents.push(doc);
  }

  /**
   * Recupera los documentos de QA más relevantes mediante similitud vectorial de tokens (Mejora #6).
   */
  searchSimilar(queryText: string, topK: number = 3): RetrievalResult[] {
    const queryTokens = this._tokenize(queryText);
    if (queryTokens.size === 0) return [];

    const scored = this.documents.map((doc) => {
      const docTokens = this._tokenize(`${doc.title} ${doc.content} ${doc.keywords.join(' ')}`);
      const score = this._cosineSimilarity(queryTokens, docTokens);
      return { document: doc, score };
    });

    return scored
      .filter((item) => item.score > 0.05)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  private _tokenize(text: string): Map<string, number> {
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2);

    const freq = new Map<string, number>();
    words.forEach((w) => {
      freq.set(w, (freq.get(w) || 0) + 1);
    });
    return freq;
  }

  private _cosineSimilarity(vecA: Map<string, number>, vecB: Map<string, number>): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    vecA.forEach((val, key) => {
      normA += val * val;
      if (vecB.has(key)) {
        dotProduct += val * vecB.get(key)!;
      }
    });

    vecB.forEach((val) => {
      normB += val * val;
    });

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private _seedDefaultKnowledge(): void {
    this.documents = [
      {
        id: 'KB-SEC-01',
        category: 'SECURITY',
        title: 'Guía de Pruebas de Seguridad en Autenticación',
        content: 'Validar siempre bloqueo por intentos sucesivos de contraseña, expiración de tokens, inyección SQL en formularios de acceso y obligatoriedad de contraseñas robustas.',
        keywords: ['login', 'contraseña', 'password', 'seguridad', 'token', 'auth', 'credenciales'],
      },
      {
        id: 'KB-PAY-01',
        category: 'PAYMENT',
        title: 'Reglas de Integridad en Transacciones Financieras y Pagos',
        content: 'Verificar idempotencia para prevenir cobros dobles por reintento de red, validación del algoritmo de Luhn en tarjetas de crédito y manejo de errores 402/504 en pasarelas de pago.',
        keywords: ['pago', 'tarjeta', 'cobro', 'factura', 'compra', 'checkout', 'orden', 'precio'],
      },
      {
        id: 'KB-ISTQB-01',
        category: 'ISTQB_GENERAL',
        title: 'Principio de Análisis de Valores Límite (BVA)',
        content: 'Para cada rango de entrada [Min, Max], generar al menos 4 vectores: Min, Min-1, Max, Max+1, asegurando detección de defectos en las fronteras de decisión.',
        keywords: ['límite', 'limite', 'frontera', 'bva', 'mínimo', 'máximo', 'rango', 'longitud'],
      },
    ];
  }
}

export const globalSemanticRetriever = new SemanticQARetriever();
