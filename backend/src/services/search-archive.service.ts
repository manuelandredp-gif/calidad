export interface SearchableTestCase {
  id: string;
  code: string;
  title: string;
  expectedResult: string;
  steps: string[];
  status: string;
  tags?: string[];
}

export interface SearchMatch<T> {
  item: T;
  score: number;
  highlightField: string;
}

export class SearchArchiveService {
  /**
   * Búsqueda Full-Text Search (FTS) ponderada en casos de prueba (Mejora #19).
   * Ponderación: Código (5x), Título (3x), Resultado Esperado (2x), Pasos (1x).
   */
  static searchTestCases(
    cases: SearchableTestCase[],
    query: string,
    limit: number = 20
  ): SearchMatch<SearchableTestCase>[] {
    if (!query.trim()) return [];

    const queryTokens = query
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 1);

    const matches: SearchMatch<SearchableTestCase>[] = [];

    cases.forEach((tc) => {
      let score = 0;
      let highlightField = 'title';

      const codeLower = tc.code.toLowerCase();
      const titleLower = tc.title.toLowerCase();
      const resultLower = tc.expectedResult.toLowerCase();
      const stepsLower = tc.steps.join(' ').toLowerCase();

      queryTokens.forEach((token) => {
        if (codeLower.includes(token)) {
          score += 10;
          highlightField = 'code';
        }
        if (titleLower.includes(token)) {
          score += 5;
          highlightField = 'title';
        }
        if (resultLower.includes(token)) {
          score += 3;
          highlightField = 'expectedResult';
        }
        if (stepsLower.includes(token)) {
          score += 1;
          highlightField = 'steps';
        }
      });

      if (score > 0) {
        matches.push({ item: tc, score, highlightField });
      }
    });

    return matches.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  /**
   * Identifica y archiva casos de prueba obsoletos o rechazados (Mejora #18).
   */
  static archiveCases(cases: SearchableTestCase[]): {
    active: SearchableTestCase[];
    archived: SearchableTestCase[];
  } {
    const active: SearchableTestCase[] = [];
    const archived: SearchableTestCase[] = [];

    cases.forEach((tc) => {
      if (tc.status === 'REJECTED') {
        archived.push(tc);
      } else {
        active.push(tc);
      }
    });

    return { active, archived };
  }
}
