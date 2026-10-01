export interface ExternalSyncItem {
  id: string;
  externalId: string;
  platform: 'AZURE_DEVOPS' | 'GITHUB_ISSUES';
  url: string;
  status: 'SYNCED' | 'FAILED';
}

export class DevOpsGitHubConnector {
  /**
   * Sincroniza un caso de prueba como Issue de GitHub con etiquetas de QA (Mejora #28).
   */
  static formatGitHubIssue(testCase: {
    code: string;
    title: string;
    type: string;
    priority: string;
    steps: string[];
    expectedResult: string;
  }) {
    const body = `### Caso de Prueba: ${testCase.code}
**Tipo:** \`${testCase.type}\` | **Prioridad:** \`${testCase.priority}\`

#### Pasos de Reproducción:
${(testCase.steps || []).map((s, i) => `${i + 1}. ${s}`).join('\n')}

#### Resultado Esperado:
${testCase.expectedResult}

---
*Generado automáticamente por [TestGenAI](https://github.com/testgenai)*`;

    return {
      title: `[QA-TEST] ${testCase.code}: ${testCase.title}`,
      body,
      labels: ['qa', 'test-case', testCase.type, `priority:${testCase.priority}`],
    };
  }

  /**
   * Formatea un caso de prueba para Azure DevOps Test Plans (Work Item de tipo 'Test Case').
   */
  static formatAzureWorkItem(testCase: {
    code: string;
    title: string;
    steps: string[];
    expectedResult: string;
  }) {
    return [
      { op: 'add', path: '/fields/System.Title', value: `[${testCase.code}] ${testCase.title}` },
      { op: 'add', path: '/fields/System.WorkItemType', value: 'Test Case' },
      {
        op: 'add',
        path: '/fields/Microsoft.VSTS.TCM.Steps',
        value: `<steps id="0">${(testCase.steps || [])
          .map((s, idx) => `<step id="${idx + 1}"><parameterizedString>${s}</parameterizedString><parameterizedString>${testCase.expectedResult}</parameterizedString></step>`)
          .join('')}</steps>`,
      },
    ];
  }
}
