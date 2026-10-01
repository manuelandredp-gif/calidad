import { describe, it, expect } from 'vitest';
import { JobQueue } from '../src/queue/job-queue';
import { CacheManager } from '../src/cache/cache-manager';
import { TokenBucketLimiter } from '../src/common/rate-limiter';
import { SemanticQARetriever } from '../src/ai/semantic-retriever';
import { HallucinationMetrics } from '../src/ai/hallucination-metrics';
import { RequirementVersioningService } from '../src/services/requirement-versioning.service';
import { BatchTransactionService } from '../src/services/batch-transaction.service';
import { RBACManager } from '../src/common/security/rbac';
import { CryptographicAuditTrail } from '../src/security/audit-trail';
import { PresenceHub } from '../src/realtime/presence-hub';

describe('Fase 4: Arquitectura Empresarial, Asincronía y Gobernanza', () => {
  it('Mejora #1: JobQueue procesa tareas asíncronas y actualiza progreso', async () => {
    const queue = new JobQueue();
    queue.registerHandler('generate_batch', async (job, updateProgress) => {
      updateProgress(50);
      return { count: 10 };
    });

    const job = await queue.add('generate_batch', { requirementId: 'req-1' });
    expect(job.status).toMatch(/WAITING|ACTIVE|COMPLETED/);

    // Esperar tick de procesamiento
    await new Promise((r) => setTimeout(r, 50));
    const processed = queue.getJob(job.id);
    expect(processed?.status).toBe('COMPLETED');
    expect(processed?.result).toEqual({ count: 10 });
    expect(processed?.progress).toBe(100);
  });

  it('Mejora #4: CacheManager soporta invalidación por tags de dominio', () => {
    const cache = new CacheManager();
    cache.set('cases:req-1', [{ id: 1 }], { tags: ['req:req-1', 'project:proj-A'] });
    cache.set('cases:req-2', [{ id: 2 }], { tags: ['req:req-2', 'project:proj-A'] });

    expect(cache.get('cases:req-1')).toEqual([{ id: 1 }]);
    expect(cache.get('cases:req-2')).toEqual([{ id: 2 }]);

    // Invalidar solo req-1
    cache.invalidateByTag('req:req-1');
    expect(cache.get('cases:req-1')).toBeNull();
    expect(cache.get('cases:req-2')).toBeDefined();

    // Invalidar todo el proyecto
    cache.invalidateByTag('project:proj-A');
    expect(cache.get('cases:req-2')).toBeNull();
  });

  it('Mejora #5: TokenBucketLimiter controla ráfagas y rechaza exceso', () => {
    const limiter = new TokenBucketLimiter({ capacity: 3, refillRatePerSecond: 1 });

    expect(limiter.consume('user-1').allowed).toBe(true);
    expect(limiter.consume('user-1').allowed).toBe(true);
    expect(limiter.consume('user-1').allowed).toBe(true);

    // Agotado: la cuarta debe ser rechazada
    const blocked = limiter.consume('user-1');
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('Mejora #6: SemanticQARetriever recupera contexto QA relevante por similitud', () => {
    const retriever = new SemanticQARetriever();
    const results = retriever.searchSimilar('pasarela de cobro y tarjeta de crédito con saldo');

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].document.category).toBe('PAYMENT');
  });

  it('Mejora #9: HallucinationMetrics evalúa cuantitativamente fidelidad y alucinación', () => {
    const reqText = 'El sistema permite registrar usuarios con correo y clave.';
    const groundedCase = HallucinationMetrics.evaluateCase(
      reqText,
      'Registro con correo válido',
      'El usuario queda registrado en el sistema con su correo',
      ['Ingresar correo', 'Ingresar clave']
    );

    expect(groundedCase.faithfulnessScore).toBeGreaterThanOrEqual(70);
    expect(groundedCase.hallucinationRisk).toBe('LOW');

    const hallucinatoryCase = HallucinationMetrics.evaluateCase(
      reqText,
      'Venta de criptomonedas con blockchain de etherium',
      'Transferir tokens a billetera fría descentralizada',
      ['Conectar metamask', 'Aprobar gas fee']
    );

    expect(hallucinatoryCase.ungroundedClaims.length).toBeGreaterThan(0);
  });

  it('Mejora #17: RequirementVersioningService guarda historial inmutable y snapshots', () => {
    const versioning = new RequirementVersioningService();
    const snap1 = versioning.createSnapshot(
      'req-1',
      { title: 'T1', description: 'D1', acceptanceCriteria: 'C1' },
      'user-lead'
    );
    const snap2 = versioning.createSnapshot(
      'req-1',
      { title: 'T1', description: 'D1 modificada', acceptanceCriteria: 'C1' },
      'user-lead'
    );

    expect(snap1.version).toBe(1);
    expect(snap2.version).toBe(2);

    const history = versioning.getHistory('req-1');
    expect(history).toHaveLength(2);
  });

  it('Mejora #20: BatchTransactionService fragmenta operaciones masivas en chunks', async () => {
    const items = Array.from({ length: 120 }, (_, i) => ({ id: `tc-${i}` }));
    const result = await BatchTransactionService.executeInChunks(items, 50, async (chunk) => {
      return chunk.map((item) => `approved_${item.id}`);
    });

    expect(result.totalProcessed).toBe(120);
    expect(result.chunksCount).toBe(3); // 50 + 50 + 20
    expect(result.results).toHaveLength(120);
  });

  it('Mejora #32: RBACManager evalúa permisos granulares por rol', () => {
    expect(RBACManager.can('ADMIN', 'project:delete')).toBe(true);
    expect(RBACManager.can('QA_LEAD', 'testcase:approve')).toBe(true);
    expect(RBACManager.can('QA_TESTER', 'testcase:approve')).toBe(false);
    expect(RBACManager.can('VIEWER', 'testcase:generate')).toBe(false);
  });

  it('Mejora #35: CryptographicAuditTrail valida integridad y detecta manipulación', () => {
    const trail = new CryptographicAuditTrail();
    trail.recordEvent('USER_LOGIN', 'u1', { ip: '127.0.0.1' });
    trail.recordEvent('PROJECT_CREATE', 'u1', { name: 'Proj A' });

    const check = trail.verifyChainIntegrity();
    expect(check.isValid).toBe(true);
    expect(check.checkedBlocks).toBe(3); // Genesis + 2 eventos

    // Si alguien altera un bloque en la memoria
    const chain = (trail as unknown as { chain: Array<{ payload: Record<string, unknown> }> }).chain;
    chain[1].payload = { ip: '192.168.1.1' }; // Alteración ilícita


    const compromisedCheck = trail.verifyChainIntegrity();
    expect(compromisedCheck.isValid).toBe(false);
    expect(compromisedCheck.corruptedIndex).toBe(1);
  });

  it('Mejora #48: PresenceHub gestiona latidos y bloqueo optimista de entidades', () => {
    const hub = new PresenceHub();
    hub.heartbeat({ userId: 'u1', userName: 'Carlos', activeView: 'test-cases' });

    expect(hub.getActiveUsers()).toHaveLength(1);

    // Bloqueo de entidad
    const lock1 = hub.acquireLock('tc-100', 'u1', 'Carlos');
    expect(lock1.acquired).toBe(true);

    // Intento de bloqueo por otro usuario mientras está activo
    const lock2 = hub.acquireLock('tc-100', 'u2', 'Ana');
    expect(lock2.acquired).toBe(false);
    expect(lock2.heldBy).toBe('Carlos');

    // Liberar bloqueo
    expect(hub.releaseLock('tc-100', 'u1')).toBe(true);
    const lock3 = hub.acquireLock('tc-100', 'u2', 'Ana');
    expect(lock3.acquired).toBe(true);
  });
});
