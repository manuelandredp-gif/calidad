export interface MaskingResult {
  maskedText: string;
  piiFound: boolean;
  totalMasked: number;
  maskMap: Map<string, string>; // placeholder -> original
}

export class PIIMasker {
  private static readonly EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b/g;
  private static readonly CREDIT_CARD_REGEX = /\b(?:\d{4}[ -]?){3}\d{4}\b|\b\d{15,16}\b/g;
  private static readonly PHONE_REGEX = /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b/g;
  private static readonly API_KEY_REGEX = /\b(?:sk-[a-zA-Z0-9]{20,}|ghp_[a-zA-Z0-9]{30,}|AIza[0-9A-Za-z-_]{35}|Bearer\s+[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*)\b/g;
  private static readonly DNI_REGEX = /\b\d{8}[A-Z]?\b|\b[A-Z]{1,2}-?\d{6,8}\b/g;
  private static readonly IP_REGEX = /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g;

  /**
   * Enmascara datos sensibles y PII en un texto antes de ser transmitido a proveedores externos de IA.
   */
  static mask(text: string): MaskingResult {
    let masked = text;
    const maskMap = new Map<string, string>();
    let counter = 1;

    // 1. Claves API y Tokens
    masked = masked.replace(this.API_KEY_REGEX, (match) => {
      const tag = `{{SECRET_TOKEN_${counter++}}}`;
      maskMap.set(tag, match);
      return tag;
    });

    // 2. Tarjetas de crédito
    masked = masked.replace(this.CREDIT_CARD_REGEX, (match) => {
      // Validar longitud básica de tarjeta
      const cleanDigits = match.replace(/\D/g, '');
      if (cleanDigits.length >= 13 && cleanDigits.length <= 19) {
        const tag = `{{CARD_MASKED_${counter++}}}`;
        maskMap.set(tag, match);
        return tag;
      }
      return match;
    });

    // 3. Correos electrónicos
    masked = masked.replace(this.EMAIL_REGEX, (match) => {
      const tag = `{{EMAIL_MASKED_${counter++}}}`;
      maskMap.set(tag, match);
      return tag;
    });

    // 4. Teléfonos
    masked = masked.replace(this.PHONE_REGEX, (match) => {
      // Evitar enmascarar números simples
      const digits = match.replace(/\D/g, '');
      if (digits.length >= 7 && digits.length <= 15) {
        const tag = `{{PHONE_MASKED_${counter++}}}`;
        maskMap.set(tag, match);
        return tag;
      }
      return match;
    });

    // 5. Documentos de Identidad (DNI)
    masked = masked.replace(this.DNI_REGEX, (match) => {
      const tag = `{{ID_MASKED_${counter++}}}`;
      maskMap.set(tag, match);
      return tag;
    });

    // 6. Direcciones IP
    masked = masked.replace(this.IP_REGEX, (match) => {
      const tag = `{{IP_MASKED_${counter++}}}`;
      maskMap.set(tag, match);
      return tag;
    });

    return {
      maskedText: masked,
      piiFound: maskMap.size > 0,
      totalMasked: maskMap.size,
      maskMap,
    };
  }

  /**
   * Restaura los datos originales en un texto previamente enmascarado.
   */
  static unmask(maskedText: string, maskMap: Map<string, string>): string {
    let unmasked = maskedText;
    maskMap.forEach((original, placeholder) => {
      unmasked = unmasked.split(placeholder).join(original);
    });
    return unmasked;
  }
}
