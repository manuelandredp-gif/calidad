import { describe, it, expect } from 'vitest';
import { OpenAPIContractValidator } from '../src/common/openapi-validator';

describe('OpenAPIContractValidator (Mejora #38)', () => {
  it('aprueba respuestas que cumplen estrictamente el contrato OpenAPI', () => {
    const validAuthResponse = {
      token: 'jwt_valid_token_string',
      user: { id: 'u1', email: 'test@example.com' },
    };

    const result = OpenAPIContractValidator.validate('auth.response', validAuthResponse);
    expect(result.isValid).toBe(true);
    expect(result.violations).toHaveLength(0);
    expect(() => OpenAPIContractValidator.assertContract('auth.response', validAuthResponse)).not.toThrow();
  });

  it('detecta violaciones de campos requeridos o tipos inválidos', () => {
    const invalidTestCaseResponse = {
      id: 'tc-1',
      code: 'CP-001',
      // Faltan 'title', 'expectedResult', 'status'
    };

    const result = OpenAPIContractValidator.validate('testcase.response', invalidTestCaseResponse);
    expect(result.isValid).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
    expect(() => OpenAPIContractValidator.assertContract('testcase.response', invalidTestCaseResponse)).toThrowError(
      /Contract Violation/
    );
  });
});
