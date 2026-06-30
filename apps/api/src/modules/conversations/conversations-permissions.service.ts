import { Injectable } from "@nestjs/common";
import {
  Conversation,
  ConversationParticipant,
  ConversationParticipantRole,
  ConversationVisibility,
  Prisma,
} from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

export type ConversationWithRelations = Conversation & {
  participants: ConversationParticipant[];
  bans: Array<{ userId: number; expiresAt: Date | null }>;
};

@Injectable()
export class ConversationsPermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getViewerRole(conversationId: number, userId: number | undefined): Promise<ConversationParticipantRole | null> {
    if (!userId) return null;
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
      select: { role: true, leftAt: true },
    });
    if (!participant || participant.leftAt) return null;
    return participant.role;
  }

  isHost(role: ConversationParticipantRole | null): boolean {
    return role === "HOST";
  }

  isModerator(role: ConversationParticipantRole | null): boolean {
    return role === "MODERATOR" || role === "HOST";
  }

  canManageRoom(role: ConversationParticipantRole | null): boolean {
    return role === "HOST" || role === "MODERATOR";
  }

  canSpeak(role: ConversationParticipantRole | null): boolean {
    return role === "SPEAKER" || role === "MODERATOR" || role === "HOST";
  }

  isBanned(bans: Array<{ userId: number; expiresAt: Date | null }>, userId: number): boolean {
    const now = new Date();
    return bans.some((b) => b.userId === userId && (!b.expiresAt || b.expiresAt > now));
  }

  async canViewerSee(
    conversation: Conversation,
    viewerUserId: number | undefined,
    viewerRole: string | undefined,
    inviteToken?: string,
  ): Promise<boolean> {
    if (conversation.deletedAt) return false;
    const isAdmin = viewerRole === "ADMIN" || viewerRole === "MODERATOR";
    if (isAdmin) return true;
    if (conversation.createdById === viewerUserId) return true;

    if (conversation.visibility === ConversationVisibility.PUBLIC) return true;

    if (conversation.visibility === ConversationVisibility.UNIVERSITY) {
      if (!viewerUserId) return false;
      const profile = await this.prisma.profile.findUnique({
        where: { userId: viewerUserId },
        select: { universityId: true },
      });
      if (!profile?.universityId) return false;
      if (conversation.universityId && profile.universityId !== conversation.universityId) return false;
      return true;
    }

    // PRIVATE
    if (!viewerUserId) {
      if (inviteToken) {
        return this.isValidInvite(conversation.id, inviteToken);
      }
      return false;
    }
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId: conversation.id, userId: viewerUserId } },
      select: { id: true },
    });
    if (participant) return true;
    if (inviteToken) {
      return this.isValidInvite(conversation.id, inviteToken);
    }
    return false;
  }

  private async isValidInvite(conversationId: number, token: string): Promise<boolean> {
    const { hashToken } = await import("./conversations.constants");
    const tokenHash = await hashToken(token);
    const invite = await this.prisma.conversationInvite.findUnique({
      where: { tokenHash },
      select: { id: true, expiresAt: true, maxUses: true, uses: true, revokedAt: true, conversationId: true },
    });
    if (!invite || invite.conversationId !== conversationId) return false;
    if (invite.revokedAt) return false;
    if (invite.expiresAt < new Date()) return false;
    if (invite.uses >= invite.maxUses) return false;
    return true;
  }

  async countActiveParticipants(conversationId: number): Promise<number> {
    return this.prisma.conversationParticipant.count({
      where: { conversationId, leftAt: null },
    });
  }

  async countSpeakers(conversationId: number): Promise<number> {
    return this.prisma.conversationParticipant.count({
      where: {
        conversationId,
        leftAt: null,
        role: { in: ["SPEAKER", "MODERATOR", "HOST"] },
      },
    });
  }
}
