import { createHash } from 'crypto';

export interface AuditBlock {
  index: number;
  timestamp: string;
  action: string;
  actorId: string;
  payload: Record<string, unknown>;
  previousHash: string;
  hash: string;
}

export class CryptographicAuditTrail {
  private chain: AuditBlock[] = [];
  private static readonly GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

  constructor() {
    this._initGenesis();
  }

  /**
   * Registra un evento de auditoría criptográficamente encadenado (Hash Chain) (Mejora #35).
   */
  recordEvent(action: string, actorId: string, payload: Record<string, unknown> = {}): AuditBlock {
    const previousBlock = this.chain[this.chain.length - 1];
    const previousHash = previousBlock ? previousBlock.hash : CryptographicAuditTrail.GENESIS_HASH;
    const index = this.chain.length;
    const timestamp = new Date().toISOString();

    const hash = this._computeHash(index, timestamp, action, actorId, payload, previousHash);

    const block: AuditBlock = {
      index,
      timestamp,
      action,
      actorId,
      payload,
      previousHash,
      hash,
    };

    this.chain.push(block);
    return block;
  }

  /**
   * Verifica la integridad matemática de toda la cadena de auditoría para detectar manipulaciones no autorizadas.
   */
  verifyChainIntegrity(): { isValid: boolean; checkedBlocks: number; corruptedIndex?: number } {
    for (let i = 1; i < this.chain.length; i++) {
      const current = this.chain[i];
      const previous = this.chain[i - 1];

      // 1. Validar enlace de puntero de hash
      if (current.previousHash !== previous.hash) {
        return { isValid: false, checkedBlocks: i, corruptedIndex: i };
      }

      // 2. Validar recálculo del hash del bloque
      const recalculatedHash = this._computeHash(
        current.index,
        current.timestamp,
        current.action,
        current.actorId,
        current.payload,
        current.previousHash
      );

      if (current.hash !== recalculatedHash) {
        return { isValid: false, checkedBlocks: i, corruptedIndex: i };
      }
    }

    return { isValid: true, checkedBlocks: this.chain.length };
  }

  getChain(): AuditBlock[] {
    return [...this.chain];
  }

  private _computeHash(
    index: number,
    timestamp: string,
    action: string,
    actorId: string,
    payload: Record<string, unknown>,
    previousHash: string
  ): string {
    const raw = `${index}|${timestamp}|${action}|${actorId}|${JSON.stringify(payload)}|${previousHash}`;
    return createHash('sha256').update(raw).digest('hex');
  }

  private _initGenesis(): void {
    if (this.chain.length === 0) {
      const timestamp = new Date().toISOString();
      const hash = this._computeHash(0, timestamp, 'GENESIS', 'system', { system: 'TestGenAI' }, CryptographicAuditTrail.GENESIS_HASH);
      this.chain.push({
        index: 0,
        timestamp,
        action: 'GENESIS',
        actorId: 'system',
        payload: { system: 'TestGenAI' },
        previousHash: CryptographicAuditTrail.GENESIS_HASH,
        hash,
      });
    }
  }
}

export const globalAuditTrail = new CryptographicAuditTrail();
