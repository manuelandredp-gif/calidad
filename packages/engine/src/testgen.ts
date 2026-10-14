import type { Requirement, TestCase } from './types.js';

export function generateCases(requirements: Requirement[]): TestCase[] {
  return requirements.flatMap(casesFor);
}

function casesFor(requirement: Requirement): TestCase[] {
  const values = valuesFor(requirement);
  return values.map((item, index) => toCase(requirement, item, index));
}

type Value = { value: number; type: TestCase['type']; technique: string; data: string; expected: string };

function valuesFor(requirement: Requirement): Value[] {
  const c = requirement.constraint;
  if (!c) return [];
  if (c.type === 'rango') return rangeValues(c.a, c.b, c.unit);
  if (c.type === 'umbral') return thresholdValues(c.v, c.strict, c.unit);
  if (c.type === 'condicion') return conditionValues(c.v, c.money, c.less, c.consequence);
  if (c.type === 'carga') return [{ value: c.v, type: 'nf', technique: 'Perfil de carga', data: `${c.v} usuarios concurrentes`, expected: 'Mantiene el criterio de aceptación definido' }];
  return boundaryValues(c.v, c.type, c.unit);
}

function rangeValues(a: number, b: number, unit: string): Value[] {
  const u = unit ? ` ${unit}` : '';
  const raw: [number, TestCase['type'], string][] = [
    [a - 1, 'invalido', `BVA · a−1`],
    [a, 'limite', `BVA · a`],
    [a + 1, 'valido', `BVA · a+1`],
    [Math.round((a + b) / 2), 'valido', `EP · nominal`],
    [b - 1, 'valido', `BVA · b−1`],
    [b, 'limite', `BVA · b`],
    [b + 1, 'invalido', `BVA · b+1`],
  ];
  return raw
    .filter(uniqueByValue)
    .map(([v, type, technique]) => ({
      value: v,
      type,
      technique,
      data: `${v}${u}`,
      expected: type === 'invalido' ? 'Rechaza el valor y muestra un mensaje de error' : 'Acepta el valor',
    }));
}

function thresholdValues(v: number, strict: boolean, unit: string): Value[] {
  const u = unit ? ` ${unit}` : '';
  return [
    { value: v - 1, type: 'nf' as const, technique: 'Umbral · por debajo', data: `Medido: ${v - 1}${u}`, expected: strict ? `Cumple: menos de ${v}${u}` : `Cumple` },
    { value: v, type: 'limite' as const, technique: 'Umbral · en el valor', data: `Medido: ${v}${u}`, expected: strict ? `No cumple: se exige menos de ${v}${u}` : 'Cumple: justo en el máximo' },
    { value: v + 1, type: 'invalido' as const, technique: 'Umbral · por encima', data: `Medido: ${v + 1}${u}`, expected: 'No cumple: se registra la falla' },
  ];
}

function conditionValues(v: number, money: boolean, less: boolean, consequence: string): Value[] {
  const step = money ? 0.01 : 1;
  const fmt = (n: number) => money ? `S/ ${n.toFixed(2)}` : String(n);
  if (less) {
    return [
      { value: v - step, type: 'valido', technique: 'BVA · condición', data: fmt(v - step), expected: `Se ejecuta: ${consequence}` },
      { value: v, type: 'limite', technique: 'BVA · límite', data: fmt(v), expected: 'No se ejecuta' },
      { value: v + step, type: 'valido', technique: 'BVA · condición no cumplida', data: fmt(v + step), expected: 'No se ejecuta' },
    ];
  }
  return [
    { value: v + step, type: 'valido', technique: 'BVA · condición', data: fmt(v + step), expected: `Se ejecuta: ${consequence}` },
    { value: v, type: 'limite', technique: 'BVA · límite', data: fmt(v), expected: 'No se ejecuta' },
    { value: v - step, type: 'valido', technique: 'BVA · condición no cumplida', data: fmt(v - step), expected: 'No se ejecuta' },
  ];
}

function boundaryValues(v: number, type: 'max' | 'min', unit: string): Value[] {
  const u = unit ? ` ${unit}` : '';
  const invalidBelow = type === 'min';
  return [
    { value: v - 1, type: invalidBelow ? 'invalido' : 'valido', technique: 'BVA · límite−1', data: `${v - 1}${u}`, expected: invalidBelow ? 'Rechaza el valor' : 'Acepta el valor' },
    { value: v, type: 'limite', technique: 'BVA · límite', data: `${v}${u}`, expected: 'Acepta el valor' },
    { value: v + 1, type: invalidBelow ? 'valido' : 'invalido', technique: 'BVA · límite+1', data: `${v + 1}${u}`, expected: invalidBelow ? 'Acepta el valor' : 'Rechaza el valor' },
  ];
}

function toCase(req: Requirement, item: Value, index: number): TestCase {
  return {
    id: `TC-${req.id.replace('-', '')}-${String(index + 1).padStart(2, '0')}`,
    reqId: req.id,
    value: item.value,
    type: item.type,
    technique: item.technique,
    data: item.data,
    expected: item.expected,
    priority: req.priority ?? 'Sin prioridad',
  };
}

function uniqueByValue(item: [number, string, string], index: number, arr: [number, string, string][]): boolean {
  return arr.findIndex((other) => other[0] === item[0]) === index;
}
