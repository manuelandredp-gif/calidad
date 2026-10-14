import type { Requirement, TestCase } from './types.js';

export function generateCases(requirements: Requirement[]): TestCase[] {
  return requirements.flatMap(casesFor);
}

function casesFor(requirement: Requirement): TestCase[] {
  const values = valuesFor(requirement);
  return values.map((item, index) => toCase(requirement, item, index));
}

type Value = { value: number; type: TestCase['type']; technique: string; expected: string };

function valuesFor(requirement: Requirement): Value[] {
  const constraint = requirement.constraint;
  if (!constraint) return [];
  if (constraint.type === 'rango') return range(constraint.a, constraint.b);
  if (constraint.type === 'umbral') return threshold(constraint.v, constraint.strict, constraint.unit);
  if (constraint.type === 'carga') return [{ value: constraint.v, type: 'nf', technique: 'Perfil de carga', expected: 'Mantiene el criterio de aceptación definido' }];
  return boundary(constraint.v, constraint.type);
}

function range(a: number, b: number): Value[] {
  const values = [[a - 1, 'invalido', 'BVA · a−1'], [a, 'limite', 'BVA · a'], [a + 1, 'valido', 'BVA · a+1'], [Math.round((a + b) / 2), 'valido', 'EP · nominal'], [b - 1, 'valido', 'BVA · b−1'], [b, 'limite', 'BVA · b'], [b + 1, 'invalido', 'BVA · b+1']] as const;
  return values.filter(uniqueValue).map(([value, type, technique]) => ({ value, type, technique, expected: type === 'invalido' ? 'Rechaza el valor y muestra un mensaje de error' : 'Acepta el valor' }));
}

function uniqueValue(item: readonly [number, string, string], index: number, values: readonly (readonly [number, string, string])[]): boolean {
  return values.findIndex((other) => other[0] === item[0]) === index;
}

function threshold(value: number, strict: boolean, unit: string): Value[] {
  const criterion = strict ? `menos de ${value} ${unit}` : `como máximo ${value} ${unit}`;
  return [{ value: value - 1, type: 'nf', technique: 'Umbral · por debajo', expected: `Cumple: ${criterion}` }, { value, type: 'limite', technique: 'Umbral · en el valor', expected: strict ? `No cumple: se exige menos de ${value} ${unit}` : 'Cumple: justo en el máximo' }, { value: value + 1, type: 'invalido', technique: 'Umbral · por encima', expected: 'No cumple: se registra la falla' }];
}

function boundary(value: number, type: 'max' | 'min' | 'condicion'): Value[] {
  const invalidBelow = type === 'min';
  return [{ value: value - 1, type: invalidBelow ? 'invalido' : 'valido', technique: 'BVA · límite−1', expected: invalidBelow ? 'Rechaza el valor' : 'Acepta el valor' }, { value, type: 'limite', technique: 'BVA · límite', expected: 'Acepta el valor' }, { value: value + 1, type: invalidBelow ? 'valido' : 'invalido', technique: 'BVA · límite+1', expected: invalidBelow ? 'Acepta el valor' : 'Rechaza el valor' }];
}

function toCase(requirement: Requirement, item: Value, index: number): TestCase {
  const unit = unitFor(requirement);
  return { id: `TC-${requirement.id.replace('-', '')}-${String(index + 1).padStart(2, '0')}`, reqId: requirement.id, value: item.value, type: item.type, technique: item.technique, data: requirement.constraint?.type === 'umbral' ? `Medido: ${item.value}${unit}` : `${item.value}${unit}`, expected: item.expected, priority: requirement.priority ?? 'Sin prioridad' };
}

function unitFor(requirement: Requirement): string {
  const constraint = requirement.constraint;
  if (!constraint) return '';
  if (constraint.type === 'carga') return ' usuarios concurrentes';
  if (constraint.type === 'condicion') return '';
  return ` ${constraint.unit}`;
}
