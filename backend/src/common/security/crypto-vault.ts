// ==============================================================================
// Security: CryptoVault (Mejora 58 - Protección Criptográfica de Tokens)
// Cifrado simétrico autenticado AES-256-GCM para datos sensibles.
// ==============================================================================

import crypto from 'crypto';
import { env } from '../../config/env';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

export class CryptoVault {
  private static getKey(): Buffer {
    // Derivar clave de 32 bytes usando SHA-256 sobre JWT_SECRET
    return crypto.createHash('sha256').update(env.JWT_SECRET).digest();
  }

  /**
   * Cifra un texto en claro retornando una cadena codificada en base64 (IV + Tag + Ciphertext).
   */
  public static encrypt(plainText: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = this.getKey();
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plainText, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    const authTag = cipher.getAuthTag();

    const payload = Buffer.concat([iv, authTag, encrypted]);
    return payload.toString('base64');
  }

  /**
   * Descifra una cadena cifrada con AES-256-GCM verificando autenticidad con AuthTag.
   */
  public static decrypt(cipherTextBase64: string): string {
    const buffer = Buffer.from(cipherTextBase64, 'base64');
    if (buffer.length < IV_LENGTH + TAG_LENGTH) {
      throw new Error('Payload cifrado corrupto o con longitud insuficiente.');
    }

    const iv = buffer.subarray(0, IV_LENGTH);
    const authTag = buffer.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const encrypted = buffer.subarray(IV_LENGTH + TAG_LENGTH);

    const key = this.getKey();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
