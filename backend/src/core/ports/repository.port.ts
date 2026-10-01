export interface IRepository<T, CreateDTO = Partial<T>, UpdateDTO = Partial<T>> {
  findById(id: string): Promise<T | null>;
  findAll(filter?: Record<string, unknown>): Promise<T[]>;
  create(data: CreateDTO): Promise<T>;
  update(id: string, data: UpdateDTO): Promise<T>;
  delete(id: string): Promise<boolean>;
}

export interface DomainTestCase {
  id: string;
  requirementId: string;
  code: string;
  type: string;
  title: string;
  preconditions: string[];
  steps: string[];
  testData: string | null;
  expectedResult: string;
  priority: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'MODIFIED';
  source: 'AI_GENERATED' | 'RULE_BASED' | 'MANUAL';
  createdAt: Date;
  updatedAt: Date;
}

export interface ITestCaseRepository extends IRepository<DomainTestCase> {
  findByRequirementId(requirementId: string): Promise<DomainTestCase[]>;
  batchApprove(ids: string[]): Promise<number>;
  batchReject(ids: string[]): Promise<number>;
}

export interface DomainRequirement {
  id: string;
  projectId: string;
  code: string;
  title: string;
  description: string;
  acceptanceCriteria: string;
  version: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRequirementRepository extends IRepository<DomainRequirement> {
  findByProjectId(projectId: string): Promise<DomainRequirement[]>;
}
