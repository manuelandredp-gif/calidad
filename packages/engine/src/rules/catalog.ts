import type { RuleDefinition } from '../types.js';

const source = (attribute: string) => `IEEE 830 / ISO/IEC/IEEE 29148 · atributo ${attribute}`;
const example = (bad: string, good: string) => ({ bad: [bad], good: [good] });

export const RULES: RuleDefinition[] = [
  rule('AMB-01', 'no_ambiguo', 'alta', 'Léxico', 'Término subjetivo sin criterio medible', 'Un término subjetivo admite varias interpretaciones.', ['adecuado', 'adecuada', 'rápido', 'rápida', 'fácil', 'amigable', 'eficiente', 'robusto', 'intuitivo', 'sencillo', 'óptimo', 'moderno'], 'Sustituir por un valor medible con unidad.', example('El sistema debe ser rápido.', 'El sistema debe responder en menos de 2 s.')),
  rule('AMB-02', 'no_ambiguo', 'alta', 'Léxico', 'Cláusula de escape', 'Las cláusulas de escape dejan el alcance abierto.', ['etc.', 'y/o', 'según corresponda', 'si es posible', 'entre otros', 'cuando sea necesario'], 'Enumerar el alcance exacto.', example('Exportar a PDF y/o Excel, etc.', 'Exportar el reporte en formato PDF.')),
  rule('AMB-03', 'no_ambiguo', 'media', 'Patrón', 'Voz pasiva sin sujeto', 'Sin actor explícito no queda claro quién es responsable.', [], 'Reescribir en voz activa con el actor.', example('Los reportes serán generados.', 'El sistema debe generar el reporte mensual.')),
  rule('VER-01', 'verificable', 'alta', 'Estructura', 'Requisito no funcional sin valor ni unidad', 'Sin valor y unidad no existe resultado esperado.', [], 'Agregar valor, unidad y condición.', example('RNF-01 El sistema debe tener buen rendimiento.', 'RNF-01 El sistema debe responder en menos de 2 s.')),
  rule('VER-02', 'verificable', 'media', 'Léxico', 'Cuantificador vago', 'Un cuantificador vago no fija una cantidad medible.', ['varios', 'varias', 'algunos', 'algunas', 'muchos', 'muchas', 'pocos', 'pocas', 'diversos'], 'Reemplazar por una cantidad.', example('Debe soportar varios usuarios.', 'Debe soportar 200 usuarios concurrentes.')),
  rule('COM-01', 'completo', 'alta', 'Estructura', 'Falta el sujeto o actor', 'El modelo exige un sujeto.', [], 'Indicar el sujeto.', example('Permitir el registro de clientes.', 'El sistema debe permitir al vendedor registrar clientes.')),
  rule('COM-02', 'completo', 'media', 'Patrón', 'Falta un resultado observable', 'Sin resultado observable no se puede decidir si la prueba pasa.', [], 'Describir qué se observa.', example('El sistema debe ser seguro.', 'El sistema debe bloquear la cuenta tras 3 intentos.')),
  rule('COM-03', 'completo', 'media', 'Estructura', 'No define qué pasa si se viola la restricción', 'Las entradas inválidas necesitan un resultado esperado.', [], 'Agregar el comportamiento ante valores inválidos.', example('Contraseña de entre 8 y 16 caracteres.', 'Rechazar otra longitud con un mensaje de error.')),
  rule('COM-04', 'completo', 'alta', 'Léxico', 'Marcador pendiente', 'Un requisito con valores por definir no está listo.', ['TBD', 'por definir', 'pendiente', '??'], 'Completar el valor pendiente.', example('El tiempo máximo es TBD.', 'El tiempo máximo es 5 s.')),
  rule('COR-01', 'correcto', 'media', 'Estructura', 'Requisito no atómico', 'Varias acciones impiden trazarlas por separado.', [], 'Separar por acción.', example('El sistema debe generar y exportar el reporte.', 'El sistema debe generar el reporte.')),
  rule('VIA-01', 'viable', 'media', 'Léxico', 'Absoluto difícil de garantizar', 'Los absolutos rara vez son demostrables.', ['siempre', 'nunca', 'todos', 'todas', '100 %', '100%', 'totalmente', 'ningún'], 'Acotar con un porcentaje o condición.', example('Debe estar disponible siempre.', 'Disponibilidad del 99,5 % mensual.')),
  rule('PRI-01', 'priorizable', 'baja', 'Estructura', 'Sin prioridad asignada', 'Sin prioridad no se ordena el plan de pruebas.', [], 'Asignar Alta, Media o Baja.', example('RF-07 El sistema debe guardar.', 'RF-07 El sistema debe guardar. Prioridad: Alta')),
  rule('CON-01', 'consistente', 'alta', 'Estructura', 'ID duplicado', 'Dos requisitos con el mismo ID rompen la trazabilidad.', [], 'Renumerar con un ID único.', example('RF-02 ... / RF-02 ...', 'RF-02 ... / RF-03 ...')),
  rule('CON-02', 'consistente', 'media', 'Heurística', 'Umbrales contradictorios sobre el mismo sujeto', 'Reservada para el MVP.', [], 'Unificar el umbral.', example('Responder en menos de 2 s y 5 s.', 'Responder en menos de 2 s.')),
  rule('NEC-01', 'necesario', 'baja', 'Marca de revisión', 'Sin vínculo a objetivo o actor', 'Necesario requiere juicio humano.', [], 'Vincular a un objetivo del negocio.', example('El sistema debe mostrar un fondo animado.', 'Objetivo: aumentar la conversión.'))
];

function rule(id: string, attribute: RuleDefinition['attribute'], severity: RuleDefinition['severity'], kind: RuleDefinition['kind'], title: string, why: string, terms: string[], rewriteHint: string, examples: RuleDefinition['examples']): RuleDefinition {
  return { id, attribute, severity, kind, title, why, terms, examples, rewriteHint, source: source(attribute), enabled: true };
}
