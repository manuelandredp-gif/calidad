export interface TokenBucket {
  tokens: number;
  lastRefillTime: number;
}

export interface RateLimitDecision {
  allowed: boolean;
  remainingTokens: number;
  retryAfterSeconds: number;
  limit: number;
}

export class TokenBucketLimiter {
  private buckets: Map<string, TokenBucket> = new Map();
  private readonly capacity: number;
  private readonly refillRatePerSecond: number;

  constructor(options?: { capacity?: number; refillRatePerSecond?: number }) {
    this.capacity = options?.capacity ?? 30; // Capacidad máxima del bucket
    this.refillRatePerSecond = options?.refillRatePerSecond ?? 5; // Tokens regenerados por segundo
  }

  /**
   * Evalúa y consume tokens según el algoritmo Token Bucket (Mejora #5).
   */
  consume(key: string, tokensToConsume: number = 1): RateLimitDecision {
    const now = Date.now();
    let bucket = this.buckets.get(key);

    if (!bucket) {
      bucket = { tokens: this.capacity, lastRefillTime: now };
      this.buckets.set(key, bucket);
    } else {
      // Regenerar tokens basados en el tiempo transcurrido
      const elapsedSeconds = (now - bucket.lastRefillTime) / 1000;
      const tokensToAdd = elapsedSeconds * this.refillRatePerSecond;
      bucket.tokens = Math.min(this.capacity, bucket.tokens + tokensToAdd);
      bucket.lastRefillTime = now;
    }

    if (bucket.tokens >= tokensToConsume) {
      bucket.tokens -= tokensToConsume;
      return {
        allowed: true,
        remainingTokens: Math.floor(bucket.tokens),
        retryAfterSeconds: 0,
        limit: this.capacity,
      };
    }

    const deficit = tokensToConsume - bucket.tokens;
    const retryAfterSeconds = Math.ceil(deficit / this.refillRatePerSecond);

    return {
      allowed: false,
      remainingTokens: 0,
      retryAfterSeconds,
      limit: this.capacity,
    };
  }

  reset(key?: string): void {
    if (key) this.buckets.delete(key);
    else this.buckets.clear();
  }
}
