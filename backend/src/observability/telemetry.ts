export interface TraceSpan {
  traceId: string;
  spanId: string;
  name: string;
  startTime: number;
  durationMs?: number;
  attributes: Record<string, string | number | boolean>;
  status: 'OK' | 'ERROR';
}

export class OpenTelemetryTracer {
  private spans: TraceSpan[] = [];

  /**
   * Inicia un nuevo Span de telemetría distribuida para medir operaciones críticas (Mejora #42).
   */
  startSpan(name: string, attributes: Record<string, string | number | boolean> = {}): {
    spanId: string;
    end: (status?: 'OK' | 'ERROR') => TraceSpan;
  } {
    const traceId = `trace_${Math.random().toString(36).slice(2, 10)}`;
    const spanId = `span_${Math.random().toString(36).slice(2, 10)}`;
    const startTime = Date.now();

    const span: TraceSpan = {
      traceId,
      spanId,
      name,
      startTime,
      attributes,
      status: 'OK',
    };

    return {
      spanId,
      end: (status: 'OK' | 'ERROR' = 'OK') => {
        span.durationMs = Date.now() - startTime;
        span.status = status;
        this.spans.push(span);
        return span;
      },
    };
  }

  getCompletedSpans(): TraceSpan[] {
    return [...this.spans];
  }

  clearSpans(): void {
    this.spans = [];
  }
}

export const globalTracer = new OpenTelemetryTracer();
