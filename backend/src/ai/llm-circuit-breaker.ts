export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerConfig {
  failureThreshold?: number; // fallos consecutivos antes de abrir
  cooldownPeriodMs?: number; // tiempo antes de probar de nuevo (HALF_OPEN)
}

export class LLMCircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private readonly failureThreshold: number;
  private readonly cooldownPeriodMs: number;

  constructor(config?: CircuitBreakerConfig) {
    this.failureThreshold = config?.failureThreshold ?? 3;
    this.cooldownPeriodMs = config?.cooldownPeriodMs ?? 30000;
  }

  /**
   * Obtiene el estado actual del circuito considerando expiración del cooldown.
   */
  getState(): CircuitState {
    if (this.state === 'OPEN') {
      const elapsed = Date.now() - this.lastFailureTime;
      if (elapsed > this.cooldownPeriodMs) {
        this.state = 'HALF_OPEN';
      }
    }
    return this.state;
  }

  /**
   * Ejecuta una llamada a un proveedor de IA con protección de Circuit Breaker y fallback en cascada (Mejora #10).
   */
  async executeWithFallback<T>(
    primaryCall: () => Promise<T>,
    secondaryCall: () => Promise<T>,
    offlineFallback: () => T | Promise<T>
  ): Promise<{ result: T; providerUsed: 'primary' | 'secondary' | 'offline_fallback' }> {
    const currentState = this.getState();

    // 1. Si el circuito no está OPEN, intentar el proveedor principal
    if (currentState !== 'OPEN') {
      try {
        const result = await primaryCall();
        this.recordSuccess();
        return { result, providerUsed: 'primary' };
      } catch {
        this.recordFailure();
      }
    }

    // 2. Si el circuito principal está abierto o falló, recurrir al proveedor secundario
    try {
      const result = await secondaryCall();
      return { result, providerUsed: 'secondary' };
    } catch {
      // Proveedor secundario falló
    }

    // 3. Fallback infalible de último recurso: motor heurístico offline determinista (0 tokens)
    const result = await offlineFallback();
    return { result, providerUsed: 'offline_fallback' };
  }

  recordSuccess(): void {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold || this.state === 'HALF_OPEN') {
      this.state = 'OPEN';
    }
  }

  getMetrics() {
    return {
      state: this.getState(),
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime ? new Date(this.lastFailureTime).toISOString() : null,
      cooldownPeriodMs: this.cooldownPeriodMs,
      threshold: this.failureThreshold,
    };
  }

  reset(): void {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.lastFailureTime = 0;
  }
}
