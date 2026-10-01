import { RawGeneratedCase } from '../interfaces/ai-provider.interface';

export interface StateTransition {
  id: string;
  fromState: string;
  event: string;
  guard?: string;
  toState: string;
  action: string;
  isValid: boolean;
}

export interface StateMachineModel {
  title: string;
  states: string[];
  initialState: string;
  finalStates: string[];
  transitions: StateTransition[];
}

export interface StateTransitionResult {
  model: StateMachineModel;
  coverageType: '0-SWITCH' | '1-SWITCH' | 'INVALID_TRANSITIONS';
  cases: RawGeneratedCase[];
}

export class StateTransitionEngine {
  /**
   * Genera casos de prueba de transición de estados según la técnica formal ISTQB.
   * Cubre:
   * 1. 0-Switch Coverage (cada transición válida probada al menos una vez).
   * 2. Invalid Transition Testing (intentar eventos no permitidos en cada estado).
   * 3. 1-Switch Sequence Testing (pares de transiciones secuenciales A -> B -> C).
   */
  static generateTestCases(model: StateMachineModel): StateTransitionResult {
    const cases: RawGeneratedCase[] = [];

    // 1. Cobertura 0-Switch (Transiciones Válidas individuales)
    const validTransitions = model.transitions.filter((t) => t.isValid);
    validTransitions.forEach((trans, idx) => {
      const caseCode = `STE-0S-${String(idx + 1).padStart(2, '0')}`;
      const guardText = trans.guard ? ` [Condición de guarda: ${trans.guard}]` : '';

      cases.push({
        type: 'positive',
        title: `[Transición de Estados 0-Switch] ${trans.fromState} --(${trans.event})--> ${trans.toState}`,
        preconditions: [
          `El sistema o entidad '${model.title}' se encuentra en el estado inicial: '${trans.fromState}'`,
          trans.guard ? `Se cumple la precondición/guarda: '${trans.guard}'` : 'Condiciones operativas normales',
        ],
        steps: [
          `Verificar que la entidad esté confirmada en estado '${trans.fromState}'`,
          `Disparar el evento o acción '${trans.event}'${guardText}`,
          `Confirmar la ejecución de la acción '${trans.action}'`,
        ],
        testData: `Evento: ${trans.event}, Estado previo: ${trans.fromState}`,
        expectedResult: `El estado de la entidad transiciona exitosamente a '${trans.toState}'. Acción ejecutada: ${trans.action}.`,
        priority: 'high',
        evidenceStatus: 'derived',
        evidenceText: `Técnica ISTQB Transición de Estados 0-Switch (${caseCode})`,
      });
    });

    // 2. Pruebas de Transiciones Inválidas (Robustez / Negativas)
    // Para cada estado, buscar eventos que NO tienen transición de salida válida
    const allEvents = Array.from(new Set(model.transitions.map((t) => t.event)));
    let invalidCount = 0;

    model.states.forEach((state) => {
      // Si es un estado final, ningún evento de transición debe permitirse
      const allowedEventsInState = new Set(
        model.transitions.filter((t) => t.fromState === state && t.isValid).map((t) => t.event)
      );

      const illegalEvents = allEvents.filter((ev) => !allowedEventsInState.has(ev));

      illegalEvents.slice(0, 2).forEach((illegalEvent) => {
        invalidCount++;
        const caseCode = `STE-INV-${String(invalidCount).padStart(2, '0')}`;

        cases.push({
          type: 'negative',
          title: `[Transición Inválida ISTQB] Disparo ilegal de '${illegalEvent}' en estado '${state}'`,
          preconditions: [
            `La entidad '${model.title}' se encuentra actualmente en el estado '${state}'`,
            'El sistema debe bloquear transiciones no registradas en el diagrama de estados',
          ],
          steps: [
            `Asegurar que el sistema se mantenga en estado '${state}'`,
            `Intentar forzar el evento o solicitud '${illegalEvent}' (acción no permitida en este estado)`,
          ],
          testData: `Evento ilegal: ${illegalEvent}, Estado actual: ${state}`,
          expectedResult: `El sistema rechaza la operación, emite error de estado inválido y preserva el estado '${state}' sin corrupción de datos.`,
          priority: 'medium',
          evidenceStatus: 'derived',
          evidenceText: `Técnica ISTQB Transición Inválida (${caseCode})`,
        });
      });
    });

    // 3. Cobertura 1-Switch (Secuencia de 2 transiciones consecutivas: S1 -> S2 -> S3)
    let oneSwitchCount = 0;
    validTransitions.forEach((t1) => {
      const followUpTransitions = validTransitions.filter((t2) => t2.fromState === t1.toState);
      followUpTransitions.slice(0, 1).forEach((t2) => {
        oneSwitchCount++;
        const caseCode = `STE-1S-${String(oneSwitchCount).padStart(2, '0')}`;

        cases.push({
          type: 'positive',
          title: `[Secuencia 1-Switch ISTQB] Recorrido: ${t1.fromState} -> ${t1.toState} -> ${t2.toState}`,
          preconditions: [
            `Entidad en estado '${t1.fromState}'`,
            'Flujo continuo de ciclo de vida habilitado',
          ],
          steps: [
            `Estando en '${t1.fromState}', invocar '${t1.event}' para alcanzar '${t1.toState}'`,
            `Verificar llegada a '${t1.toState}' y ejecutar inmediatamente el siguiente evento '${t2.event}'`,
            `Validar el cambio final a '${t2.toState}'`,
          ],
          testData: `Secuencia: [${t1.event}] seguido de [${t2.event}]`,
          expectedResult: `El ciclo de vida transiciona correctamente por los dos estados consecutivos culminando en '${t2.toState}'.`,
          priority: 'high',
          evidenceStatus: 'derived',
          evidenceText: `Técnica ISTQB 1-Switch Sequence (${caseCode})`,
        });
      });
    });

    return {
      model,
      coverageType: '1-SWITCH',
      cases,
    };
  }

  /**
   * Deduce un modelo de máquina de estados a partir de criterios de aceptación típicos
   * (e.g. borradores, aprobaciones, cancelaciones, estados de pedido, sesión, etc.)
   */
  static parseFromText(featureTitle: string, text: string): StateTransitionResult {
    const lower = text.toLowerCase();

    // Detección de patrones comunes de ciclo de vida
    let model: StateMachineModel;

    if (lower.includes('pedido') || lower.includes('orden') || lower.includes('compra')) {
      model = {
        title: featureTitle,
        states: ['CREADO', 'PAGADO', 'EN_PREPARACION', 'ENVIADO', 'ENTREGADO', 'CANCELADO'],
        initialState: 'CREADO',
        finalStates: ['ENTREGADO', 'CANCELADO'],
        transitions: [
          { id: 'T1', fromState: 'CREADO', event: 'Procesar Pago', guard: 'Saldo suficiente', toState: 'PAGADO', action: 'Generar comprobante', isValid: true },
          { id: 'T2', fromState: 'CREADO', event: 'Cancelar Orden', guard: 'Antes de 24 horas', toState: 'CANCELADO', action: 'Liberar stock', isValid: true },
          { id: 'T3', fromState: 'PAGADO', event: 'Iniciar Despacho', toState: 'EN_PREPARACION', action: 'Asignar a almacén', isValid: true },
          { id: 'T4', fromState: 'EN_PREPARACION', event: 'Enviar Guía', toState: 'ENVIADO', action: 'Notificar al cliente con tracking', isValid: true },
          { id: 'T5', fromState: 'ENVIADO', event: 'Confirmar Recepción', toState: 'ENTREGADO', action: 'Cerrar orden', isValid: true },
        ],
      };
    } else if (lower.includes('usuario') || lower.includes('cuenta') || lower.includes('registro')) {
      model = {
        title: featureTitle,
        states: ['REGISTRADO', 'ACTIVO', 'BLOQUEADO', 'ELIMINADO'],
        initialState: 'REGISTRADO',
        finalStates: ['ELIMINADO'],
        transitions: [
          { id: 'T1', fromState: 'REGISTRADO', event: 'Confirmar Correo', guard: 'Token válido', toState: 'ACTIVO', action: 'Habilitar acceso completo', isValid: true },
          { id: 'T2', fromState: 'ACTIVO', event: 'Fallar Login 3 Veces', guard: 'Intentos >= 3', toState: 'BLOQUEADO', action: 'Enviar alerta de seguridad', isValid: true },
          { id: 'T3', fromState: 'BLOQUEADO', event: 'Restablecer Clave', guard: 'OTP correcto', toState: 'ACTIVO', action: 'Desbloquear cuenta', isValid: true },
          { id: 'T4', fromState: 'ACTIVO', event: 'Solicitar Baja', guard: 'Confirmación expresa', toState: 'ELIMINADO', action: 'Anonimizar datos', isValid: true },
        ],
      };
    } else {
      // Ciclo de vida genérico: INICIADO -> EN_PROCESO -> COMPLETADO / RECHAZADO
      model = {
        title: featureTitle,
        states: ['BORRADOR', 'EN_REVISION', 'APROBADO', 'RECHAZADO'],
        initialState: 'BORRADOR',
        finalStates: ['APROBADO', 'RECHAZADO'],
        transitions: [
          { id: 'T1', fromState: 'BORRADOR', event: 'Enviar a Revisión', guard: 'Campos requeridos completos', toState: 'EN_REVISION', action: 'Notificar a revisores', isValid: true },
          { id: 'T2', fromState: 'EN_REVISION', event: 'Aprobar', guard: 'Cumple criterios de aceptación', toState: 'APROBADO', action: 'Publicar entidad', isValid: true },
          { id: 'T3', fromState: 'EN_REVISION', event: 'Rechazar', guard: 'Observaciones registradas', toState: 'RECHAZADO', action: 'Regresar observaciones al creador', isValid: true },
        ],
      };
    }

    return this.generateTestCases(model);
  }
}
