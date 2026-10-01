import { describe, it, expect } from 'vitest';
import { LLMCircuitBreaker } from '../src/ai/llm-circuit-breaker';

describe('LLMCircuitBreaker (Mejora #10)', () => {
  it('ejecuta proveedor principal cuando está sano (CLOSED)', async () => {
    const cb = new LLMCircuitBreaker({ failureThreshold: 2 });

    const response = await cb.executeWithFallback(
      async () => 'primary_ok',
      async () => 'secondary_ok',
      () => 'offline_ok'
    );

    expect(response.providerUsed).toBe('primary');
    expect(response.result).toBe('primary_ok');
    expect(cb.getState()).toBe('CLOSED');
  });

  it('abre el circuito y conmuta al proveedor secundario ante fallos sucesivos', async () => {
    const cb = new LLMCircuitBreaker({ failureThreshold: 2, cooldownPeriodMs: 5000 });

    // Falla 1
    await cb.executeWithFallback(
      async () => { throw new Error('Primary error'); },
      async () => 'secondary_ok',
      () => 'offline_ok'
    );
    expect(cb.getState()).toBe('CLOSED'); // 1/2 fallos

    // Falla 2 -> debe abrir el circuito (OPEN)
    const resp2 = await cb.executeWithFallback(
      async () => { throw new Error('Primary error 2'); },
      async () => 'secondary_ok',
      () => 'offline_ok'
    );
    expect(resp2.providerUsed).toBe('secondary');
    expect(cb.getState()).toBe('OPEN');

    // Falla 3 -> estando OPEN, ni siquiera intenta el principal, va directo a secundario
    let primaryCalled = false;
    const resp3 = await cb.executeWithFallback(
      async () => { primaryCalled = true; return 'primary_ok'; },
      async () => 'secondary_ok_fast',
      () => 'offline_ok'
    );
    expect(primaryCalled).toBe(false); // Circuito abierto protegió el endpoint
    expect(resp3.result).toBe('secondary_ok_fast');
  });

  it('recurre al motor heurístico offline si fallan ambos proveedores externos', async () => {
    const cb = new LLMCircuitBreaker();

    const response = await cb.executeWithFallback(
      async () => { throw new Error('Gemini quota 429'); },
      async () => { throw new Error('OpenAI outage 503'); },
      () => 'deterministic_heuristic_cases'
    );

    expect(response.providerUsed).toBe('offline_fallback');
    expect(response.result).toBe('deterministic_heuristic_cases');
  });
});
