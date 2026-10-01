import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { TestCaseStatus } from '../src/core/domain/value-objects/test-case-status.vo';
import { ISTQBTechnique } from '../src/core/domain/value-objects/istqb-technique.vo';
import { TestCasePriority, TestCaseCode, RequirementCode } from '../src/core/domain/value-objects/entity-codes.vo';
import { TestCaseEntity } from '../src/core/domain/entities/test-case.entity';
import { TestCaseMapper, PrismaTestCaseRow } from '../src/core/domain/mappers/test-case.mapper';
import { RequirementFingerprintService } from '../src/core/domain/services/requirement-fingerprint.service';
import { AIFactory } from '../src/core/ai.factory';
import { IAIProvider, AIGenerationOptions, AIGenerationResult } from '../src/core/interfaces/ai-provider.interface';
import { SecurityPolicy } from '../src/core/domain/security/security-policy';

describe('Architectural Fitness Functions (Forensic Clean Architecture Suite)', () => {
  const rootSrcDir = path.resolve(__dirname, '../src');
  const domainDir = path.resolve(rootSrcDir, 'core/domain');

  // Helper recursivo para listar archivos .ts
  function getTsFiles(dir: string): string[] {
    let results: string[] = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    for (const file of list) {
      const fullPath = path.resolve(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat && stat.isDirectory()) {
        results = results.concat(getTsFiles(fullPath));
      } else if (file.endsWith('.ts')) {
        results.push(fullPath);
      }
    }
    return results;
  }

  // =========================================================================
  // FF-01: Pureza del Dominio (Domain Purity - Hexagonal / Onion Architecture)
  // Ningún archivo de Dominio puede importar Express, Prisma, Axios o frameworks I/O
  // =========================================================================
  describe('FF-01: Domain Layer Purity & Framework Independence', () => {
    it('core/domain no debe importar express, @prisma/client, axios o utilidades de transporte HTTP', () => {
      const domainFiles = getTsFiles(domainDir);
      expect(domainFiles.length).toBeGreaterThan(0);

      const forbiddenImports = ['express', '@prisma/client', 'axios', 'supertest'];

      for (const filePath of domainFiles) {
        const content = fs.readFileSync(filePath, 'utf-8');
        for (const forbidden of forbiddenImports) {
          const importPattern = new RegExp(`from\\s+['"]${forbidden}['"]`, 'g');
          const hasForbidden = importPattern.test(content);
          expect(
            hasForbidden,
            `Violación arquitectónica FF-01 en ${path.relative(rootSrcDir, filePath)}: el dominio no puede depender de "${forbidden}"`
          ).toBe(false);
        }
      }
    });
  });

  // =========================================================================
  // FF-02: Entidades Ricas e Invariantes de Estado (Rich Domain Entity)
  // =========================================================================
  describe('FF-02: Rich Domain Entity Invariants (TestCaseEntity)', () => {
    function createValidEntity(): TestCaseEntity {
      return new TestCaseEntity({
        id: 'tc-001',
        requirementId: 'req-001',
        code: TestCaseCode.from('TC-001'),
        type: ISTQBTechnique.from('EQUIVALENCE_PARTITIONING'),
        title: 'Validar login exitoso con credenciales correctas',
        preconditions: ['Usuario registrado'],
        steps: ['Ingresar usuario', 'Ingresar password', 'Click en login'],
        testData: 'user@test.com',
        expectedResult: 'Acceso concedido al dashboard',
        priority: TestCasePriority.from('HIGH'),
        status: TestCaseStatus.PENDING,
        version: 1,
        source: 'AI_GENERATED',
        evidenceStatus: 'derived',
        evidenceText: 'Criterio de aceptación 1',
      });
    }

    it('permite aprobar un caso y avanza la versión optimista', () => {
      const tc = createValidEntity();
      expect(tc.status.getValue()).toBe('PENDING');
      expect(tc.version).toBe(1);

      tc.approve('reviewer-admin-01', 'Excelente cobertura');
      expect(tc.status.getValue()).toBe('APPROVED');
      expect(tc.version).toBe(2);
    });

    it('falla al aprobar si falta el ID de auditor', () => {
      const tc = createValidEntity();
      expect(() => tc.approve('')).toThrow(/auditor/i);
    });

    it('rechaza un caso exigiendo motivo explícito para auditoría', () => {
      const tc = createValidEntity();
      expect(() => tc.reject('reviewer-admin-01', '')).toThrow(/motivo/i);

      tc.reject('reviewer-admin-01', 'Falta cobertura del caso de timeout');
      expect(tc.status.getValue()).toBe('REJECTED');
      expect(tc.version).toBe(2);
    });

    it('aplica control de concurrencia optimista assertVersionMatch()', () => {
      const tc = createValidEntity();
      expect(() => tc.assertVersionMatch(1)).not.toThrow();
      expect(() => tc.assertVersionMatch(99)).toThrow(/conflicto de concurrencia/i);
    });
  });

  // =========================================================================
  // FF-03: Value Objects Inmutables e Invariantes
  // =========================================================================
  describe('FF-03: Value Objects Immutability & Normalization', () => {
    it('TestCaseStatus valida estados permitidos y transiciones', () => {
      const pending = TestCaseStatus.from('PENDING');
      expect(pending.isPending()).toBe(true);
      expect(pending.isApproved()).toBe(false);

      const approved = TestCaseStatus.from('APPROVED');
      expect(approved.isApproved()).toBe(true);

      expect(() => TestCaseStatus.from('STATUS_INVALIDO' as unknown as string)).toThrow(/inválido|desconocido/i);
    });

    it('ISTQBTechnique normaliza alias técnicos y detecta categorización de caja negra/blanca', () => {
      const bva = ISTQBTechnique.from('BVA');
      expect(bva.getValue()).toBe('boundary');
      expect(bva.isBlackBox()).toBe(true);
      expect(bva.isExperienceBased()).toBe(false);

      const eg = ISTQBTechnique.from('error-guessing');
      expect(eg.isExperienceBased()).toBe(true);

      expect(ISTQBTechnique.from('POSITIVE').getValue()).toBe('positive');
    });

    it('TestCasePriority y Códigos de Dominio validan formato', () => {
      const prio = TestCasePriority.from('HIGH');
      expect(prio.getNumericWeight()).toBe(3);
      expect(prio.isHigh()).toBe(true);

      const tcCode = TestCaseCode.from('TC-REQ-001');
      expect(tcCode.getValue()).toBe('TC-REQ-001');
      expect(() => TestCaseCode.from('')).toThrow(/vacío/i);

      const reqCode = RequirementCode.from('REQ-AUTH-01');
      expect(reqCode.getValue()).toBe('REQ-AUTH-01');
      expect(() => RequirementCode.from('   ')).toThrow(/vacío/i);
    });
  });

  // =========================================================================
  // FF-04: Mapeo y Aislamiento de Capas (TestCaseMapper)
  // =========================================================================
  describe('FF-04: Data Mapper Pattern & Persistence Isolation', () => {
    it('TestCaseMapper transforma registros Prisma a Entidad y viceversa sin pérdida de tipo', () => {
      const prismaRow: PrismaTestCaseRow = {
        id: 'tc-uuid-123',
        requirementId: 'req-uuid-456',
        code: 'TC-01',
        type: 'EQUIVALENCE_PARTITIONING',
        title: 'Verificar payload válido',
        preconditions: JSON.stringify(['Servidor activo', 'Token válido']),
        steps: JSON.stringify(['Enviar POST /data', 'Validar status 200']),
        testData: '{"name": "test"}',
        expectedResult: '200 OK con id generado',
        priority: 'MEDIUM',
        status: 'PENDING',
        source: 'AI_GENERATED',
        evidenceStatus: 'derived',
        evidenceText: 'Derivado del swagger',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const entity = TestCaseMapper.toDomain(prismaRow);
      expect(entity.id).toBe('tc-uuid-123');
      expect(entity.preconditions).toEqual(['Servidor activo', 'Token válido']);
      expect(entity.steps).toEqual(['Enviar POST /data', 'Validar status 200']);
      expect(entity.priority.getLevel()).toBe('medium');

      const persistencePayload = TestCaseMapper.toPersistence(entity);
      expect(persistencePayload.id).toBe('tc-uuid-123');
      expect(JSON.parse(persistencePayload.preconditions)).toEqual(['Servidor activo', 'Token válido']);
    });
  });

  // =========================================================================
  // FF-05: Servicios de Dominio Deterministas (Deduplicación & Hash)
  // =========================================================================
  describe('FF-05: Deterministic Requirement Fingerprinting', () => {
    it('genera el mismo hash SHA-256 ante entradas semánticamente idénticas y distingue diferencias', () => {
      const baseReq = {
        code: 'REQ-01',
        title: 'Módulo de Facturación',
        description: 'Generación de facturas electrónicas',
        acceptanceCriteria: 'Debe emitir XML con firma digital',
        provider: 'gemini',
        model: 'gemini-1.5-pro',
      };

      const hash1 = RequirementFingerprintService.compute(baseReq);
      const hash2 = RequirementFingerprintService.compute({ ...baseReq });
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 hex string

      // Diferencia en modelo debe cambiar el hash
      const hashDiffModel = RequirementFingerprintService.compute({ ...baseReq, model: 'gpt-4o' });
      expect(hashDiffModel).not.toBe(hash1);
    });
  });

  // =========================================================================
  // FF-06: Extensibilidad Open/Closed (AIFactory Strategy Registry)
  // =========================================================================
  describe('FF-06: Open/Closed Extensible AI Factory Registry', () => {
    it('permite registrar nuevos proveedores dinámicamente sin modificar el código fuente', async () => {
      class CustomMockAnthropicProvider implements IAIProvider {
        async generateTestCases(
          reqCode: string,
          _reqTitle: string,
          _reqDesc: string,
          _reqCrit: string,
          _options?: AIGenerationOptions
        ): Promise<AIGenerationResult> {
          return {
            provider: 'claude-custom',
            model: 'claude-3-5-sonnet',
            promptVersion: 'v1.0',
            inputTokens: 50,
            outputTokens: 120,
            responseTimeMs: 250,
            estimatedCost: 0.001,
            cases: [
              {
                code: `TC-${reqCode}-01`,
                type: 'STATE_TRANSITION',
                title: 'Caso custom generado dinámicamente',
                preconditions: ['Mock iniciado'],
                steps: ['Ejecutar paso'],
                testData: 'N/A',
                expectedResult: 'Resultado exitoso',
                priority: 'HIGH',
              },
            ],
          };
        }
      }

      AIFactory.registerProvider('claude-custom', () => new CustomMockAnthropicProvider());

      expect(AIFactory.hasProvider('claude-custom')).toBe(true);
      const providerInstance = AIFactory.getProvider('claude-custom');
      const result = await providerInstance.generateTestCases('REQ-TEST', '', '', '');

      expect(result.provider).toBe('claude-custom');
      expect(result.cases[0].title).toBe('Caso custom generado dinámicamente');
    });
  });

  // =========================================================================
  // FF-07: Políticas de Seguridad Puras en Dominio (SecurityPolicy)
  // =========================================================================
  describe('FF-07: Pure Security & Authorization Policies', () => {
    it('valida políticas de rol sin acoplarse al framework Express', () => {
      expect(SecurityPolicy.isAdmin('ADMIN')).toBe(true);
      expect(SecurityPolicy.isAdmin('TESTER')).toBe(false);

      expect(SecurityPolicy.canExecuteTestCaseReview({ userId: 'u1', role: 'ADMIN' })).toBe(true);
      expect(SecurityPolicy.canExecuteTestCaseReview({ userId: 'u2', role: 'QA_LEAD' })).toBe(true);
      expect(SecurityPolicy.canExecuteTestCaseReview({ userId: 'u3', role: 'VIEWER' })).toBe(false);

      expect(SecurityPolicy.canAccessProject('owner-1', { userId: 'admin-1', role: 'ADMIN' })).toBe(true);
      expect(SecurityPolicy.canAccessProject('owner-1', { userId: 'owner-1', role: 'TESTER' })).toBe(true);
      expect(SecurityPolicy.canAccessProject('owner-1', { userId: 'other-user', role: 'TESTER' })).toBe(false);
    });
  });
});
