import { describe, it, expect } from 'vitest';
import { StaleDetectorService } from '../src/services/stale-detector.service';

describe('StaleDetectorService (Mejora #49)', () => {
  it('detecta casos obsoletos cuando el requisito fue actualizado posteriormente', () => {
    const pastDate = new Date(Date.now() - 1000 * 60 * 60 * 24 * 5); // 5 días atrás
    const recentlyUpdated = new Date(Date.now() - 1000 * 60 * 10); // 10 minutos atrás

    const input = {
      requirementUpdatedAt: recentlyUpdated,
      requirementVersion: 2,
      testCases: [
        {
          id: 'tc-1',
          createdAt: pastDate,
          updatedAt: pastDate,
          status: 'APPROVED',
        },
        {
          id: 'tc-2',
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'PENDING',
        },
      ],
    };

    const evaluations = StaleDetectorService.evaluateTestCases(input);

    expect(evaluations).toHaveLength(2);
    expect(evaluations[0].isStale).toBe(true);
    expect(evaluations[0].reason).toContain('El requisito fue modificado tras la creación del caso');

    // El segundo caso generado después de la actualización no debe estar obsoleto
    expect(evaluations[1].isStale).toBe(false);
  });
});
