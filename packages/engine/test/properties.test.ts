import { describe, expect, it } from 'vitest';
import * as fc from 'fast-check';
import { analyze } from '../src/index.js';

describe('propiedades del motor', () => {
  it('determinismo: mismo input produce misma salida', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 0, maxLength: 500 }), (text) => {
        const a = analyze(text);
        const b = analyze(text);
        expect(a.hash).toBe(b.hash);
        expect(a.requirements.length).toBe(b.requirements.length);
        expect(a.findings.length).toBe(b.findings.length);
        expect(a.cases.length).toBe(b.cases.length);
      }),
      { numRuns: 100 }
    );
  });

  it('nunca lanza excepción con entrada arbitraria', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 0, maxLength: 1000 }), (text) => {
        expect(() => analyze(text)).not.toThrow();
      }),
      { numRuns: 200 }
    );
  });

  it('procesa 200 líneas en menos de 50 ms', () => {
    const lines = Array.from({ length: 200 }, (_, i) => `RF-${String(i + 1).padStart(2, '0')} El sistema debe realizar la acción ${i + 1}.`);
    const text = lines.join('\n');
    const start = performance.now();
    analyze(text);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(50);
  });

  it('idempotencia: analizar el mismo texto dos veces da el mismo resultado', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 10 }),
        (parts) => {
          const text = parts.join('\n');
          const first = analyze(text);
          const second = analyze(text);
          expect(JSON.stringify(first)).toBe(JSON.stringify(second));
        }
      ),
      { numRuns: 50 }
    );
  });
});
