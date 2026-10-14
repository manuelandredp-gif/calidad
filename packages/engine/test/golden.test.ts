import { describe, expect, it } from 'vitest';
import { analyze, globalScore } from '../src/index.js';
import { GOLDEN_TEXT } from './fixtures.js';

describe('ejemplo de referencia', () => {
  it('produce los conteos de referencia y calidad global de 72 %', () => {
    const result = analyze(GOLDEN_TEXT);
    expect(result.requirements).toHaveLength(6);
    expect(result.findings).toHaveLength(13);
    expect(result.cases).toHaveLength(13);
    expect(globalScore(result.requirements, result.findings)).toBe(72);
  });

  it('mantiene una huella estable', () => {
    expect(analyze(GOLDEN_TEXT).hash).toBe(analyze(GOLDEN_TEXT).hash);
  });
});
