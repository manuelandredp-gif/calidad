export interface ContractValidationResult {
  isValid: boolean;
  contractName: string;
  violations: string[];
}

export class OpenAPIContractValidator {
  private static readonly SCHEMAS: Record<string, { required: string[]; types: Record<string, string> }> = {
    'auth.response': {
      required: ['token', 'user'],
      types: { token: 'string', user: 'object' },
    },
    'project.response': {
      required: ['id', 'name'],
      types: { id: 'string', name: 'string' },
    },
    'testcase.response': {
      required: ['id', 'code', 'title', 'expectedResult', 'status'],
      types: { id: 'string', code: 'string', title: 'string', expectedResult: 'string', status: 'string' },
    },
    'heuristic.response': {
      required: ['totalGenerated', 'method', 'testCases'],
      types: { totalGenerated: 'number', method: 'string', testCases: 'object' },
    },
  };

  /**
   * Valida un payload JSON contra el contrato esperado según OpenAPI spec (Mejora #38).
   */
  static validate(schemaName: string, payload: unknown): ContractValidationResult {
    const schema = this.SCHEMAS[schemaName];
    if (!schema) {
      return {
        isValid: true,
        contractName: schemaName,
        violations: [`Esquema '${schemaName}' no registrado, validación omitida.`],
      };
    }

    const violations: string[] = [];

    if (!payload || typeof payload !== 'object') {
      violations.push(`El payload debe ser un objeto válido (recibido: ${typeof payload})`);
      return { isValid: false, contractName: schemaName, violations };
    }

    const obj = payload as Record<string, unknown>;

    // Verificar campos requeridos
    schema.required.forEach((reqField) => {
      if (obj[reqField] === undefined || obj[reqField] === null) {
        violations.push(`Campo requerido ausente en contrato: '${reqField}'`);
      }
    });

    // Verificar tipos básicos
    Object.entries(schema.types).forEach(([field, expectedType]) => {
      if (obj[field] !== undefined && obj[field] !== null) {
        const actualType = typeof obj[field];
        if (actualType !== expectedType) {
          violations.push(
            `Tipo inválido en '${field}': se esperaba '${expectedType}', pero se recibió '${actualType}'`
          );
        }
      }
    });

    return {
      isValid: violations.length === 0,
      contractName: schemaName,
      violations,
    };
  }

  /**
   * Lanza un error si el payload viola el contrato OpenAPI especificado.
   */
  static assertContract(schemaName: string, payload: unknown): void {
    const result = this.validate(schemaName, payload);
    if (!result.isValid) {
      throw new Error(
        `[Contract Violation] El contrato '${schemaName}' fue violado:\n - ${result.violations.join('\n - ')}`
      );
    }
  }
}
