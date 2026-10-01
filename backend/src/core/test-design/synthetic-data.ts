// ==========================================================================
// Core Domain: SyntheticDataEngine
// Generador y Validador Matemático de Datos Sintéticos de Prueba
// Incluye: Algoritmo de Luhn, Módulo 11 (RUC SUNAT), DNI, Strings de frontera
// ==========================================================================

export class SyntheticDataEngine {
  // ==========================================================================
  // 1. ALGORITMO DE LUHN (ISO/IEC 7812) - Tarjetas de Crédito de Prueba
  // ==========================================================================

  /**
   * Valida si un número de tarjeta cumple el algoritmo de Luhn (módulo 10).
   */
  public static validateLuhn(cardNumber: string): boolean {
    const cleaned = cardNumber.replace(/\D/g, '');
    if (cleaned.length < 13 || cleaned.length > 19) return false;

    let sum = 0;
    let shouldDouble = false;

    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned.charAt(i), 10);

      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }

      sum += digit;
      shouldDouble = !shouldDouble;
    }

    return sum % 10 === 0;
  }

  /**
   * Genera un número de tarjeta sintético que cumple matemáticamente el algoritmo de Luhn.
   * Diseñado para entornos Sandbox de pasarelas de pago.
   */
  public static generateLuhnCard(
    brand: 'visa' | 'mastercard' | 'amex' = 'visa',
    isValid = true
  ): { cardNumber: string; brand: string; isValid: boolean; expDate: string; cvv: string } {
    let prefix = '4';
    let length = 16;
    let cvvLength = 3;

    if (brand === 'mastercard') {
      const mcPrefixes = ['51', '52', '53', '54', '55'];
      prefix = mcPrefixes[Math.floor(Math.random() * mcPrefixes.length)];
      length = 16;
    } else if (brand === 'amex') {
      prefix = Math.random() > 0.5 ? '34' : '37';
      length = 15;
      cvvLength = 4;
    }

    // Generar dígitos aleatorios hasta length - 1
    let number = prefix;
    while (number.length < length - 1) {
      number += Math.floor(Math.random() * 10).toString();
    }

    // Calcular dígito verificador de Luhn
    let sum = 0;
    let shouldDouble = true;

    for (let i = number.length - 1; i >= 0; i--) {
      let digit = parseInt(number.charAt(i), 10);
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }

    const checkDigit = (10 - (sum % 10)) % 10;
    let finalCheckDigit = checkDigit;

    if (!isValid) {
      // Invertir el dígito para generar deliberadamente una tarjeta corrupta
      finalCheckDigit = (checkDigit + 1) % 10;
    }

    const fullCardNumber = number + finalCheckDigit.toString();

    // Fecha de expiración futura válida (ej. dentro de 3 años)
    const currentYear = new Date().getFullYear();
    const expMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    const expYear = String((currentYear + 2) % 100).padStart(2, '0');

    // CVV aleatorio
    let cvv = '';
    for (let i = 0; i < cvvLength; i++) {
      cvv += Math.floor(Math.random() * 10).toString();
    }

    return {
      cardNumber: fullCardNumber,
      brand: brand.toUpperCase(),
      isValid,
      expDate: `${expMonth}/${expYear}`,
      cvv,
    };
  }

  // ==========================================================================
  // 2. DOCUMENTOS PERUANOS (DNI y RUC con MÓDULO 11 de SUNAT)
  // ==========================================================================

  /**
   * Genera un DNI peruano sintético de 8 dígitos.
   */
  public static generateDni(isValid = true): { dni: string; isValid: boolean } {
    if (!isValid) {
      // DNI inválido: 7 dígitos o letras
      return { dni: '7482910', isValid: false };
    }

    // Rango realista de DNI peruano (series actuales entre 40000000 y 79999999)
    const min = 40000000;
    const max = 79999999;
    const dniNum = Math.floor(Math.random() * (max - min + 1)) + min;
    return { dni: String(dniNum), isValid: true };
  }

  /**
   * Valida un RUC peruano de 11 dígitos mediante el algoritmo oficial de Módulo 11 de SUNAT.
   */
  public static validateRuc(ruc: string): boolean {
    const cleaned = ruc.replace(/\D/g, '');
    if (cleaned.length !== 11) return false;

    const prefix = cleaned.substring(0, 2);
    if (!['10', '15', '17', '20'].includes(prefix)) return false;

    const factors = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    let sum = 0;

    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleaned.charAt(i), 10) * factors[i];
    }

    const mod = sum % 11;
    let checkDigit = 11 - mod;
    if (checkDigit === 10) checkDigit = 0;
    else if (checkDigit === 11) checkDigit = 1;

    return checkDigit === parseInt(cleaned.charAt(10), 10);
  }

  /**
   * Genera un RUC peruano válido usando el Módulo 11 oficial de SUNAT.
   * Tipo: 'natural' (prefijo 10) o 'juridica' (prefijo 20).
   */
  public static generateRuc(
    type: 'natural' | 'juridica' = 'juridica',
    isValid = true
  ): { ruc: string; type: string; isValid: boolean; description: string } {
    const prefix = type === 'natural' ? '10' : '20';
    let base = prefix;

    // Generar 8 dígitos intermedios
    for (let i = 0; i < 8; i++) {
      base += Math.floor(Math.random() * 10).toString();
    }

    // Factores oficiales de ponderación SUNAT
    const factors = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    let sum = 0;

    for (let i = 0; i < 10; i++) {
      sum += parseInt(base.charAt(i), 10) * factors[i];
    }

    const mod = sum % 11;
    let checkDigit = 11 - mod;
    if (checkDigit === 10) checkDigit = 0;
    else if (checkDigit === 11) checkDigit = 1;

    let finalCheck = checkDigit;
    if (!isValid) {
      finalCheck = (checkDigit + 1) % 10; // Corromper para caso negativo
    }

    const fullRuc = base + finalCheck.toString();
    const desc = type === 'natural' ? 'Persona Natural con RUC' : 'Empresa / Persona Jurídica';

    return {
      ruc: fullRuc,
      type: desc,
      isValid,
      description: isValid
        ? `RUC válido (${desc}) verificado con Módulo 11 SUNAT`
        : `RUC inválido con dígito de verificación corrupto`,
    };
  }

  // ==========================================================================
  // 3. STRINGS DE FRONTERA Y PAYLOADS DE SEGURIDAD DEFENSIVA
  // ==========================================================================

  /**
   * Retorna un conjunto completo de strings de frontera para pruebas de robustez de inputs.
   */
  public static getBoundaryDataSet(maxLength = 255): Record<string, { label: string; value: string; type: string; purpose: string }> {
    return {
      emptyString: {
        label: 'Cadena Vacía',
        value: '',
        type: 'negative',
        purpose: 'Verificar validación de campo requerido (longitud 0).',
      },
      singleChar: {
        label: 'Carácter Único',
        value: 'A',
        type: 'boundary',
        purpose: 'Verificar frontera mínima de texto (1 carácter).',
      },
      exactMax: {
        label: `Límite Máximo Exacto (${maxLength} chars)`,
        value: 'X'.repeat(maxLength),
        type: 'boundary',
        purpose: `Verificar aceptación exacta de ${maxLength} caracteres.`,
      },
      exceededMax: {
        label: `Excedente en 1 Carácter (${maxLength + 1} chars)`,
        value: 'X'.repeat(maxLength + 1),
        type: 'negative',
        purpose: `Verificar rechazo al sobrepasar la longitud en 1 carácter.`,
      },
      unicodeSpecial: {
        label: 'Unicode, Acentos y Emojis',
        value: 'José Peña — ¡Áéíóú! 🚀🛡️⚡',
        type: 'validation',
        purpose: 'Verificar soporte de codificación UTF-8 sin corrupción de texto (mojibake).',
      },
      spacesPadding: {
        label: 'Espacios en Blanco Perimetrales',
        value: '   texto con espacios perimetrales   ',
        type: 'validation',
        purpose: 'Verificar si el sistema aplica trim() o preserva espacios indebidamente.',
      },
      sqlInjectionPassive: {
        label: 'Payload SQL Injection (Pasivo)',
        value: `' OR '1'='1`,
        type: 'validation',
        purpose: 'Comprobar sanitización contra inyección SQL defensiva sin alterar la base de datos.',
      },
      xssScriptPassive: {
        label: 'Payload XSS Pasivo',
        value: `<script>console.log("xss_safe_test")</script>`,
        type: 'validation',
        purpose: 'Comprobar escape de entidades HTML contra Cross-Site Scripting.',
      },
      negativeInteger: {
        label: 'Entero Negativo',
        value: '-999',
        type: 'negative',
        purpose: 'Probar rechazo de cantidades negativas en campos monetarios o de conteo.',
      },
    };
  }

  // ==========================================================================
  // 4. EMAILS Y FECHAS SINTÉTICAS
  // ==========================================================================

  public static getSyntheticEmail(isValid = true): string {
    const timestamp = Date.now().toString().slice(-4);
    if (isValid) {
      return `qa.tester_${timestamp}@sandbox.example.com`;
    }
    return `qa.tester_${timestamp}@invalid..domain`;
  }
}
