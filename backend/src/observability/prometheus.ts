export class PrometheusMetricsExporter {
  private static counters: Map<string, number> = new Map();
  private static gauges: Map<string, number> = new Map();

  /**
   * Incrementa un contador métrico estilo Prometheus (Mejora #43).
   */
  static incCounter(name: string, labels: Record<string, string> = {}, value: number = 1): void {
    const key = this._formatMetricKey(name, labels);
    this.counters.set(key, (this.counters.get(key) || 0) + value);
  }

  /**
   * Actualiza el valor de un Gauge.
   */
  static setGauge(name: string, value: number, labels: Record<string, string> = {}): void {
    const key = this._formatMetricKey(name, labels);
    this.gauges.set(key, value);
  }

  /**
   * Genera el payload de métricas en formato estándar Prometheus para endpoint /metrics.
   */
  static toPrometheusText(): string {
    const lines: string[] = [
      '# HELP testgenai_generations_total Total de generaciones de casos de prueba ejecutadas',
      '# TYPE testgenai_generations_total counter',
    ];

    this.counters.forEach((val, key) => {
      lines.push(`${key} ${val}`);
    });

    lines.push(
      '# HELP testgenai_active_users Cantidad de usuarios concurrentes activos',
      '# TYPE testgenai_active_users gauge'
    );

    this.gauges.forEach((val, key) => {
      lines.push(`${key} ${val}`);
    });

    return lines.join('\n') + '\n';
  }

  private static _formatMetricKey(name: string, labels: Record<string, string>): string {
    const labelEntries = Object.entries(labels);
    if (labelEntries.length === 0) return name;
    const labelStr = labelEntries.map(([k, v]) => `${k}="${v}"`).join(',');
    return `${name}{${labelStr}}`;
  }
}
