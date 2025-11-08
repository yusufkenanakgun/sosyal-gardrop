import { api } from '../api';

export interface Notification {
  id: string;
  actor: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
  type: 'like' | 'comment' | 'follow' | 'mention';
  targetType: 'post' | 'comment' | null;
  targetId: string | null;
  content: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  nextCursor: string | null;
}

/**
 * Get user notifications
 */
export async function getNotifications(cursor?: string, limit = 20): Promise<NotificationsResponse> {
  const params = new URLSearchParams();
  if (cursor) params.append('cursor', cursor);
  params.append('limit', String(limit));

  return api.get<NotificationsResponse>(`/notifications?${params.toString()}`);
}

/**
 * Get unread notifications count
 */
export async function getUnreadCount(): Promise<{ count: number }> {
  return api.get<{ count: number }>('/notifications/unread-count');
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string): Promise<Notification> {
  return api.patch<Notification>(`/notifications/${notificationId}/read`);
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(): Promise<{ success: boolean }> {
  return api.patch<{ success: boolean }>('/notifications/read-all');
}

/**
 * Delete notification
 */
export async function deleteNotification(notificationId: string): Promise<{ success: boolean }> {
  return api.delete<{ success: boolean }>(`/notifications/${notificationId}`);
}
