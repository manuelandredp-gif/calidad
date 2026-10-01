export type JobStatus = 'WAITING' | 'ACTIVE' | 'COMPLETED' | 'FAILED';

export interface Job<T = unknown, R = unknown> {
  id: string;
  name: string;
  data: T;
  status: JobStatus;
  progress: number; // 0 - 100
  result?: R;
  error?: string;
  attempts: number;
  maxRetries: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export type JobHandler<T = unknown, R = unknown> = (
  job: Job<T, R>,
  updateProgress: (pct: number) => void
) => Promise<R>;

export type AnyJobHandler = (
  job: Job<unknown, unknown>,
  updateProgress: (pct: number) => void
) => Promise<unknown>;

export class JobQueue {
  private jobs: Map<string, Job> = new Map();
  private isProcessing: boolean = false;
  private handlers: Map<string, AnyJobHandler> = new Map();
  private concurrency: number = 3;
  private activeWorkers: number = 0;

  constructor(options?: { concurrency?: number }) {
    this.concurrency = options?.concurrency ?? 3;
  }

  /**
   * Registra un manejador para un tipo específico de tarea asíncrona.
   */
  registerHandler<T, R>(jobName: string, handler: JobHandler<T, R>): void {
    this.handlers.set(jobName, handler as unknown as AnyJobHandler);
  }



  /**
   * Encola un nuevo trabajo en segundo plano (Mejora #1).
   */
  async add<T, R>(
    jobName: string,
    data: T,
    options?: { maxRetries?: number }
  ): Promise<Job<T, R>> {
    const id = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const job: Job<T, R> = {
      id,
      name: jobName,
      data,
      status: 'WAITING',
      progress: 0,
      attempts: 0,
      maxRetries: options?.maxRetries ?? 2,
      createdAt: new Date(),
    };

    this.jobs.set(id, job as Job);
    this._triggerNext();
    return job;
  }

  /**
   * Obtiene el estado y resultado de un trabajo encolado.
   */
  getJob<T, R>(id: string): Job<T, R> | undefined {
    return this.jobs.get(id) as Job<T, R> | undefined;
  }

  /**
   * Lista todos los trabajos filtrando opcionalmente por estado.
   */
  listJobs(status?: JobStatus): Job[] {
    const all = Array.from(this.jobs.values());
    return status ? all.filter((j) => j.status === status) : all;
  }

  private async _triggerNext(): Promise<void> {
    if (this.activeWorkers >= this.concurrency) return;

    const nextJob = Array.from(this.jobs.values()).find((j) => j.status === 'WAITING');
    if (!nextJob) return;

    const handler = this.handlers.get(nextJob.name);
    if (!handler) {
      nextJob.status = 'FAILED';
      nextJob.error = `No handler registered for job type '${nextJob.name}'`;
      return;
    }

    this.activeWorkers++;
    nextJob.status = 'ACTIVE';
    nextJob.startedAt = new Date();
    nextJob.attempts++;

    const updateProgress = (pct: number) => {
      nextJob.progress = Math.min(100, Math.max(0, pct));
    };

    try {
      const result = await handler(nextJob, updateProgress);
      nextJob.status = 'COMPLETED';
      nextJob.progress = 100;
      nextJob.result = result;
      nextJob.completedAt = new Date();
    } catch (err: unknown) {
      if (nextJob.attempts <= nextJob.maxRetries) {
        nextJob.status = 'WAITING'; // Reintentar
      } else {
        nextJob.status = 'FAILED';
        nextJob.error = (err as Error).message || String(err);
        nextJob.completedAt = new Date();
      }
    } finally {
      this.activeWorkers--;
      this._triggerNext();
    }
  }
}

export const globalJobQueue = new JobQueue();
