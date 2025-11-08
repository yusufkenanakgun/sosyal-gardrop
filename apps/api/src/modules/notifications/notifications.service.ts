import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

export enum NotificationType {
  LIKE = 'like',
  COMMENT = 'comment',
  FOLLOW = 'follow',
  MENTION = 'mention',
}

export enum NotificationTargetType {
  POST = 'post',
  COMMENT = 'comment',
}

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a notification
   */
  async createNotification(
    recipientId: string,
    actorId: string,
    type: NotificationType,
    targetType?: NotificationTargetType,
    targetId?: string,
    content?: string,
  ) {
    // Don't notify yourself
    if (recipientId === actorId) {
      return null;
    }

    // Check if similar notification already exists (debouncing)
    const existingNotification = await this.prisma.notification.findFirst({
      where: {
        recipientId,
        actorId,
        type,
        targetType,
        targetId,
        createdAt: {
          gte: new Date(Date.now() - 60 * 1000), // Within last minute
        },
      },
    });

    if (existingNotification) {
      return existingNotification;
    }

    return this.prisma.notification.create({
      data: {
        recipientId,
        actorId,
        type,
        targetType,
        targetId,
        content,
      },
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  /**
   * Get notifications for user
   */
  async getUserNotifications(userId: string, cursor?: string, limit = 20) {
    const notifications = await this.prisma.notification.findMany({
      where: {
        recipientId: userId,
        ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    return {
      notifications: notifications.map((n) => this.formatNotification(n)),
      nextCursor:
        notifications.length === limit
          ? notifications[notifications.length - 1]?.createdAt.toISOString()
          : null,
    };
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: {
        recipientId: userId,
        isRead: false,
      },
    });

    return { count };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.recipientId !== userId) {
      return null;
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: {
        recipientId: userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    return { success: true };
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.recipientId !== userId) {
      return null;
    }

    await this.prisma.notification.delete({
      where: { id: notificationId },
    });

    return { success: true };
  }

  /**
   * Format notification response
   */
  private formatNotification(notification: any) {
    return {
      id: notification.id,
      actor: notification.actor,
      type: notification.type,
      targetType: notification.targetType,
      targetId: notification.targetId,
      content: notification.content,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
    };
  }
}
