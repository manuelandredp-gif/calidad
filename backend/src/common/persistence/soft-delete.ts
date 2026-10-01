export interface SoftDeletable {
  deletedAt?: Date | null;
}

export class SoftDeleteManager {
  /**
   * Genera el filtro Prisma estándar para excluir registros borrados lógicamente. (Mejora #16)
   */
  static notDeleted(): { deletedAt: null } {
    return { deletedAt: null };
  }

  /**
   * Genera el payload de datos para marcar un registro como borrado lógicamente.
   */
  static deletePayload(): { deletedAt: Date } {
    return { deletedAt: new Date() };
  }

  /**
   * Genera el payload de datos para restaurar un registro borrado lógicamente.
   */
  static restorePayload(): { deletedAt: null } {
    return { deletedAt: null };
  }

  /**
   * Filtra una lista de entidades en memoria preservando solo las no borradas.
   */
  static filterActive<T extends SoftDeletable>(items: T[]): T[] {
    return items.filter((item) => !item.deletedAt);
  }
}
