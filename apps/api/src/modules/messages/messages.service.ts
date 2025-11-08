import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class MessagesService {
  constructor(private readonly db: PrismaService) {}

  /**
   * Get all threads for a user with last message preview
   */
  async getUserThreads(userId: string) {
    const participants = await this.db.messageThreadParticipant.findMany({
      where: { userId },
      include: {
        thread: {
          include: {
            messages: {
              take: 1,
              orderBy: { createdAt: 'desc' },
              include: {
                sender: {
                  select: {
                    id: true,
                    name: true,
                    avatarUrl: true,
                  },
                },
              },
            },
            participants: {
              where: {
                userId: { not: userId },
              },
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    avatarUrl: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        thread: {
          lastMessageAt: 'desc',
        },
      },
    });

    return participants.map((p) => ({
      threadId: p.thread.id,
      otherUser: p.thread.participants[0]?.user,
      lastMessage: p.thread.messages[0] || null,
      unreadCount: p.unreadCount,
      lastMessageAt: p.thread.lastMessageAt,
      createdAt: p.thread.createdAt,
    }));
  }

  /**
   * Create or get existing thread between two users
   */
  async createOrGetThread(userId: string, recipientId: string) {
    if (userId === recipientId) {
      throw new BadRequestException('Cannot create thread with yourself');
    }

    // Check if thread already exists
    const existingParticipant = await this.db.messageThreadParticipant.findFirst({
      where: {
        userId,
        thread: {
          participants: {
            some: {
              userId: recipientId,
            },
          },
        },
      },
      include: {
        thread: {
          include: {
            participants: {
              where: {
                userId: { not: userId },
              },
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    avatarUrl: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (existingParticipant) {
      return {
        threadId: existingParticipant.thread.id,
        otherUser: existingParticipant.thread.participants[0]?.user,
        isNew: false,
      };
    }

    // Create new thread
    const thread = await this.db.messageThread.create({
      data: {
        participants: {
          create: [{ userId }, { userId: recipientId }],
        },
      },
      include: {
        participants: {
          where: {
            userId: { not: userId },
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return {
      threadId: thread.id,
      otherUser: thread.participants[0]?.user,
      isNew: true,
    };
  }

  /**
   * Get messages in a thread
   */
  async getThreadMessages(threadId: string, userId: string, cursor?: string, limit = 50) {
    // Verify user is participant
    const participant = await this.db.messageThreadParticipant.findUnique({
      where: {
        threadId_userId: {
          threadId,
          userId,
        },
      },
    });

    if (!participant) {
      throw new ForbiddenException('You are not a participant in this thread');
    }

    const messages = await this.db.message.findMany({
      where: {
        threadId,
        ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    return {
      messages: messages.reverse(),
      nextCursor: messages.length === limit ? messages[messages.length - 1]?.createdAt.toISOString() : null,
    };
  }

  /**
   * Send a message in a thread
   */
  async sendMessage(threadId: string, senderId: string, content?: string, mediaUrl?: string) {
    if (!content && !mediaUrl) {
      throw new BadRequestException('Message must have content or media');
    }

    // Verify user is participant
    const participant = await this.db.messageThreadParticipant.findUnique({
      where: {
        threadId_userId: {
          threadId,
          userId: senderId,
        },
      },
    });

    if (!participant) {
      throw new ForbiddenException('You are not a participant in this thread');
    }

    // Create message and update thread
    const message = await this.db.$transaction(async (tx) => {
      const msg = await tx.message.create({
        data: {
          threadId,
          senderId,
          content,
          mediaUrl,
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      });

      // Update thread last message time
      await tx.messageThread.update({
        where: { id: threadId },
        data: { lastMessageAt: new Date() },
      });

      // Increment unread count for other participants
      await tx.messageThreadParticipant.updateMany({
        where: {
          threadId,
          userId: { not: senderId },
        },
        data: {
          unreadCount: {
            increment: 1,
          },
        },
      });

      return msg;
    });

    return message;
  }

  /**
   * Mark thread messages as read
   */
  async markThreadAsRead(threadId: string, userId: string) {
    // Verify user is participant
    const participant = await this.db.messageThreadParticipant.findUnique({
      where: {
        threadId_userId: {
          threadId,
          userId,
        },
      },
    });

    if (!participant) {
      throw new ForbiddenException('You are not a participant in this thread');
    }

    await this.db.messageThreadParticipant.update({
      where: {
        threadId_userId: {
          threadId,
          userId,
        },
      },
      data: {
        unreadCount: 0,
        lastReadAt: new Date(),
      },
    });

    return { success: true };
  }

  /**
   * Get thread by ID (with participant check)
   */
  async getThread(threadId: string, userId: string) {
    const participant = await this.db.messageThreadParticipant.findUnique({
      where: {
        threadId_userId: {
          threadId,
          userId,
        },
      },
      include: {
        thread: {
          include: {
            participants: {
              where: {
                userId: { not: userId },
              },
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    avatarUrl: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!participant) {
      throw new NotFoundException('Thread not found');
    }

    return {
      threadId: participant.thread.id,
      otherUser: participant.thread.participants[0]?.user,
      unreadCount: participant.unreadCount,
    };
  }
}
