export interface ParsedGitRequirement {
  code: string;
  title: string;
  description: string;
  acceptanceCriteria: string;
  filePath: string;
}

export class GitSyncService {
  /**
   * Parsea un archivo Markdown de requisito proveniente de un repositorio Git (Mejora #30).
   */
  static parseMarkdownRequirement(content: string, filePath: string = 'requirements.md'): ParsedGitRequirement {
    const lines = content.split('\n');
    let code = 'REQ-001';
    let title = 'Requisito Git';
    let description = '';
    let acceptanceCriteria = '';

    // Buscar título (# [REQ-001] Título o # Título)
    for (const line of lines) {
      const titleMatch = line.match(/^#\s+(?:\[([\w-]+)\]\s+)?(.*)/);
      if (titleMatch) {
        if (titleMatch[1]) code = titleMatch[1];
        title = titleMatch[2].trim();
        break;
      }
    }

    // Extraer descripción y criterios
    const descIndex = content.indexOf('## Descripción');
    const criteriaIndex = content.indexOf('## Criterios de Aceptación');

    if (descIndex !== -1) {
      const endOfDesc = criteriaIndex !== -1 ? criteriaIndex : content.length;
      description = content
        .slice(descIndex + '## Descripción'.length, endOfDesc)
        .replace(/^>\s*/gm, '')
        .trim();
    } else {
      description = content.slice(0, 300).trim();
    }

    if (criteriaIndex !== -1) {
      acceptanceCriteria = content.slice(criteriaIndex + '## Criterios de Aceptación'.length).trim();
    } else {
      acceptanceCriteria = 'Criterios derivados automáticamente desde archivo Git.';
    }

    return {
      code,
      title,
      description,
      acceptanceCriteria,
      filePath,
    };
  }
}
