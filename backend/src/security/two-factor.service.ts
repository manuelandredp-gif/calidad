import { createHmac, randomBytes } from 'crypto';

export interface TOTPSecret {
  secret: string; // Base32 encoded
  otpAuthUrl: string;
}

export class TwoFactorService {
  /**
   * Genera un secreto criptográfico y URL para Google Authenticator / Authy (Mejora #31).
   */
  static generateSecret(userEmail: string, issuer: string = 'TestGenAI'): TOTPSecret {
    const rawBytes = randomBytes(20);
    const secret = this._base32Encode(rawBytes);
    const otpAuthUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(
      userEmail
    )}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&digits=6&period=30`;

    return { secret, otpAuthUrl };
  }

  /**
   * Valida un código numérico TOTP de 6 dígitos con ventana de tolerancia de reloj (+/- 1 ventana).
   */
  static verifyCode(secret: string, code: string, window: number = 1): boolean {
    if (!code || code.length !== 6 || !/^\d+$/.test(code)) return false;

    const currentTimeStep = Math.floor(Date.now() / 1000 / 30);

    for (let i = -window; i <= window; i++) {
      const generated = this._generateTOTP(secret, currentTimeStep + i);
      if (generated === code) return true;
    }

    return false;
  }

  private static _generateTOTP(secret: string, timeStep: number): string {
    const key = this._base32Decode(secret);
    const timeBuffer = Buffer.alloc(8);
    timeBuffer.writeBigInt64BE(BigInt(timeStep));

    const hmac = createHmac('sha1', key).update(timeBuffer).digest();
    const offset = hmac[hmac.length - 1] & 0xf;
    const binary =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);

    const otp = binary % 1000000;
    return otp.toString().padStart(6, '0');
  }

  private static _base32Encode(buffer: Buffer): string {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = 0;
    let value = 0;
    let output = '';

    for (let i = 0; i < buffer.length; i++) {
      value = (value << 8) | buffer[i];
      bits += 8;
      while (bits >= 5) {
        output += alphabet[(value >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }
    if (bits > 0) {
      output += alphabet[(value << (5 - bits)) & 31];
    }
    return output;
  }

  private static _base32Decode(base32: string): Buffer {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = 0;
    let value = 0;
    const output: number[] = [];

    const clean = base32.toUpperCase().replace(/=+$/, '');
    for (let i = 0; i < clean.length; i++) {
      const idx = alphabet.indexOf(clean[i]);
      if (idx === -1) continue;
      value = (value << 5) | idx;
      bits += 5;
      if (bits >= 8) {
        output.push((value >>> (bits - 8)) & 255);
        bits -= 8;
      }
    }
    return Buffer.from(output);
  }
}
