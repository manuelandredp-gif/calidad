import { describe, it, expect } from 'vitest';
import { AmbiguityDetectorISO29148 } from '../src/core/heuristics/ambiguity-detector';

describe('AmbiguityDetectorISO29148 (Mejora #15)', () => {
  it('detecta términos vagos y penaliza el puntaje de claridad', () => {
    const description = 'El sistema debe ser muy rápido, fácil e intuitivo para cualquier usuario.';
    const criteria = 'Debe responder aproximadamente en poco tiempo, etc.';

    const report = AmbiguityDetectorISO29148.analyze(description, criteria);

    expect(report.overallScore).toBeLessThan(70);
    expect(report.rating).toMatch(/NEEDS_IMPROVEMENT|CRITICAL_AMBIGUITY/);
    expect(report.detectedIssues.some((i) => i.category === 'VAGUE_TERM')).toBe(true);
    expect(report.suggestions.length).toBeGreaterThan(0);
  });

  it('asigna calificación EXCELLENT a requisitos cuantitativos y estructurados', () => {
    const description = 'Como Administrador del Sistema, deseo autenticar usuarios mediante correo y clave.';
    const criteria = `
      Dado un usuario registrado con rol QA_TESTER
      Cuando ingresa credenciales válidas y presiona el botón Entrar
      Entonces el sistema debe responder con HTTP 200 en menos de 500 ms y emitir un token JWT de 60 minutos.
    `;

    const report = AmbiguityDetectorISO29148.analyze(description, criteria);

    expect(report.overallScore).toBeGreaterThanOrEqual(80);
    expect(['EXCELLENT', 'ACCEPTABLE']).toContain(report.rating);
    expect(report.metrics.clarity).toBeGreaterThan(80);
  });
});
