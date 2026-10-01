export interface JiraIssuePayload {
  projectKey: string;
  issueType: string; // 'Test' | 'Story' | 'Bug'
  summary: string;
  description: string;
  priority: string;
  labels: string[];
  xrayManualSteps?: Array<{ action: string; data: string; result: string }>;
}

export interface JiraSyncResult {
  success: boolean;
  issueKey: string;
  issueUrl: string;
  xrayTestExecutionKey?: string;
  syncTimestamp: string;
}

export class JiraXrayConnector {
  private jiraBaseUrl: string;

  constructor(options?: { jiraBaseUrl?: string }) {
    this.jiraBaseUrl = options?.jiraBaseUrl || 'https://jira.company.com';
  }

  /**
   * Transforma casos de prueba de TestGenAI en especificaciones de Xray / Jira (Mejora #27).
   */
  formatTestCaseForXray(testCase: {
    code: string;
    title: string;
    type: string;
    priority: string;
    expectedResult: string;
    steps: string[];
    testData?: string | null;
  }, projectKey: string = 'QA'): JiraIssuePayload {
    const xraySteps = (testCase.steps || []).map((step, idx) => ({
      action: step,
      data: idx === 0 && testCase.testData ? testCase.testData : '',
      result: idx === (testCase.steps?.length || 1) - 1 ? testCase.expectedResult : 'Comportamiento esperado',
    }));

    return {
      projectKey,
      issueType: 'Test',
      summary: `[${testCase.code}] ${testCase.title}`,
      description: `Caso de prueba derivado formalmente por TestGenAI.\nTipo ISTQB: ${testCase.type}\nResultado Esperado: ${testCase.expectedResult}`,
      priority: testCase.priority === 'high' ? 'High' : 'Medium',
      labels: ['TestGenAI', 'AutomatedDerivation', testCase.type],
      xrayManualSteps: xraySteps,
    };
  }

  /**
   * Simula la sincronización y exportación hacia el API de Jira Cloud / Server.
   */
  async syncToJira(payload: JiraIssuePayload): Promise<JiraSyncResult> {
    const mockIssueNumber = Math.floor(1000 + Math.random() * 9000);
    const issueKey = `${payload.projectKey}-${mockIssueNumber}`;

    return {
      success: true,
      issueKey,
      issueUrl: `${this.jiraBaseUrl}/browse/${issueKey}`,
      xrayTestExecutionKey: `${payload.projectKey}-EXEC-${mockIssueNumber + 5}`,
      syncTimestamp: new Date().toISOString(),
    };
  }
}
