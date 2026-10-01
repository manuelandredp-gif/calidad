export interface BatchResult<R> {
  success: boolean;
  totalProcessed: number;
  chunksCount: number;
  durationMs: number;
  results: R[];
}

export class BatchTransactionService {
  /**
   * Procesa grandes lotes de entidades dividiéndolas en transacciones atómicas fragmentadas (Mejora #20).
   * Previene límites de parámetros en bases de datos SQLite y PostgreSQL y reduce contención de bloqueos.
   */
  static async executeInChunks<T, R>(
    items: T[],
    chunkSize: number = 50,
    worker: (chunk: T[], chunkIndex: number) => Promise<R[]>
  ): Promise<BatchResult<R>> {
    const startTime = Date.now();
    const results: R[] = [];

    const totalChunks = Math.ceil(items.length / chunkSize);

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, items.length);
      const chunk = items.slice(start, end);

      const chunkResults = await worker(chunk, i);
      results.push(...chunkResults);
    }

    return {
      success: true,
      totalProcessed: items.length,
      chunksCount: totalChunks,
      durationMs: Date.now() - startTime,
      results,
    };
  }
}
