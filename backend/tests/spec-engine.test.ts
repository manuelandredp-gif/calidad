import { describe, expect, it } from 'vitest';
import { TextNormalizer } from '../src/core/spec-engine/text-normalizer';
import { ProjectSpecEngine } from '../src/core/spec-engine';
import { ENTITY_CATALOG } from '../src/core/spec-engine/catalog/entities';

describe('motor determinista de especificación', () => {
  it('normaliza acentos sin perder letras para detectar el dominio', () => {
    expect(TextNormalizer.normalize('Gestión de exámenes clínicos')).toBe('gestion de examenes clinicos');
    expect(TextNormalizer.comparisonKey('Autenticación')).toBe(TextNormalizer.comparisonKey('autenticacion'));
  });

  it('deriva requisitos y casos de uso de una descripción en español', () => {
    const result = ProjectSpecEngine.analyze({
      name: 'Sistema de biblioteca',
      description: 'Gestionar libros, préstamos y devoluciones. Los usuarios pueden buscar libros y reservar ejemplares.',
    }, { depth: 'standard', includeNonFunctional: true, includeEntityCrud: true });
    expect(result.useCases.length).toBeGreaterThan(0);
    expect(result.requirements.length).toBeGreaterThan(0);
  });

  it('declara el resultado de un examen como campo decimal opcional', () => {
    const field = ENTITY_CATALOG.find(entity => entity.key === 'examen')?.fields.find(item => item.name === 'resultado');
    expect(field).toMatchObject({ type: 'decimal', required: false });
    expect(field?.unit).toBeUndefined();
  });
});
