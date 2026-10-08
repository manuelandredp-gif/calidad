import crypto from 'crypto';
import { prisma } from '../../config/prisma';

export class SessionService {
  public static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  public static async createSession(params: {
    userId: string;
    refreshToken: string;
    userAgent?: string;
    ipAddress?: string;
    expiresInDays?: number;
  }): Promise<string> {
    const tokenHash = this.hashToken(params.refreshToken);
    const expiresInDays = params.expiresInDays ?? 7;
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    const session = await prisma.authSession.upsert({
      where: { tokenHash },
      update: {
        userAgent: params.userAgent,
        ipAddress: params.ipAddress,
        expiresAt,
        isRevoked: false,
      },
      create: {
        userId: params.userId,
        tokenHash,
        userAgent: params.userAgent,
        ipAddress: params.ipAddress,
        expiresAt,
        isRevoked: false,
      },
    });

    return session.id;
  }

  public static async rotateSession(params: {
    oldRefreshToken: string;
    newRefreshToken: string;
    userId: string;
    userAgent?: string;
    ipAddress?: string;
    expiresInDays?: number;
  }): Promise<boolean> {
    const oldHash = this.hashToken(params.oldRefreshToken);

    return prisma.$transaction(async (tx) => {
      const revoked = await tx.authSession.updateMany({
        where: { tokenHash: oldHash, userId: params.userId, isRevoked: false, expiresAt: { gt: new Date() } },
        data: { isRevoked: true },
      });
      if (revoked.count !== 1) return false;
      await tx.authSession.create({ data: {
        userId: params.userId, tokenHash: this.hashToken(params.newRefreshToken),
        userAgent: params.userAgent, ipAddress: params.ipAddress,
        expiresAt: new Date(Date.now() + (params.expiresInDays ?? 7) * 24 * 60 * 60 * 1000), isRevoked: false,
      } });
      return true;
    });
  }

  public static async revokeSession(refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    await prisma.authSession.updateMany({
      where: { tokenHash },
      data: { isRevoked: true },
    });
  }
}
