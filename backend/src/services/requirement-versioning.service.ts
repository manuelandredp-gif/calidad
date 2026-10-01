export interface RequirementSnapshot {
  id: string;
  requirementId: string;
  version: number;
  title: string;
  description: string;
  acceptanceCriteria: string;
  authorId: string;
  createdAt: Date;
  changeSummary: string;
}

export class RequirementVersioningService {
  private snapshots: Map<string, RequirementSnapshot[]> = new Map();

  /**
   * Registra una nueva versión inmutable de un requisito (Mejora #17).
   */
  createSnapshot(
    requirementId: string,
    data: { title: string; description: string; acceptanceCriteria: string },
    authorId: string,
    changeSummary: string = 'Actualización de especificación'
  ): RequirementSnapshot {
    const list = this.snapshots.get(requirementId) || [];
    const nextVersion = list.length + 1;

    const snapshot: RequirementSnapshot = {
      id: `snap_${requirementId}_v${nextVersion}`,
      requirementId,
      version: nextVersion,
      title: data.title,
      description: data.description,
      acceptanceCriteria: data.acceptanceCriteria,
      authorId,
      createdAt: new Date(),
      changeSummary,
    };

    list.push(snapshot);
    this.snapshots.set(requirementId, list);
    return snapshot;
  }

  /**
   * Obtiene el historial completo de versiones de un requisito.
   */
  getHistory(requirementId: string): RequirementSnapshot[] {
    return (this.snapshots.get(requirementId) || []).slice().reverse();
  }

  /**
   * Obtiene una versión específica para auditoría o rollback.
   */
  getVersion(requirementId: string, version: number): RequirementSnapshot | null {
    const list = this.snapshots.get(requirementId) || [];
    return list.find((s) => s.version === version) || null;
  }
}

export const globalRequirementVersioning = new RequirementVersioningService();
