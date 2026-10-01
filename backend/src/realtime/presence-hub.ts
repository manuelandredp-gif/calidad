export interface UserPresence {
  userId: string;
  userName: string;
  activeView: string;
  editingEntityId?: string;
  lastHeartbeat: number;
}

export interface EntityLock {
  entityId: string;
  heldByUserId: string;
  heldByUserName: string;
  acquiredAt: number;
  expiresAt: number;
}

export class PresenceHub {
  private users: Map<string, UserPresence> = new Map();
  private locks: Map<string, EntityLock> = new Map();
  private readonly lockTtlMs: number = 60000; // 60 segundos de bloqueo optimista

  /**
   * Registra el latido de actividad (heartbeat) de un usuario en la plataforma (Mejora #48).
   */
  heartbeat(user: { userId: string; userName: string; activeView: string; editingEntityId?: string }): void {
    this.users.set(user.userId, {
      ...user,
      lastHeartbeat: Date.now(),
    });
  }

  /**
   * Intenta adquirir un bloqueo de edición sobre una entidad (e.g. caso de prueba o requisito).
   */
  acquireLock(entityId: string, userId: string, userName: string): { acquired: boolean; heldBy?: string } {
    const existing = this.locks.get(entityId);
    const now = Date.now();

    if (existing && existing.expiresAt > now && existing.heldByUserId !== userId) {
      return { acquired: false, heldBy: existing.heldByUserName };
    }

    this.locks.set(entityId, {
      entityId,
      heldByUserId: userId,
      heldByUserName: userName,
      acquiredAt: now,
      expiresAt: now + this.lockTtlMs,
    });

    return { acquired: true };
  }

  /**
   * Libera un bloqueo de edición explícitamente.
   */
  releaseLock(entityId: string, userId: string): boolean {
    const existing = this.locks.get(entityId);
    if (existing && existing.heldByUserId === userId) {
      this.locks.delete(entityId);
      return true;
    }
    return false;
  }

  /**
   * Obtiene la lista de usuarios activos actualmente en la aplicación (últimos 45s).
   */
  getActiveUsers(): UserPresence[] {
    const threshold = Date.now() - 45000;
    const active: UserPresence[] = [];

    this.users.forEach((u, id) => {
      if (u.lastHeartbeat >= threshold) {
        active.push(u);
      } else {
        this.users.delete(id); // Limpieza de desconectados
      }
    });

    return active;
  }
}

export const globalPresenceHub = new PresenceHub();
