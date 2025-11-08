'use client';

import { fetchJSON } from './client';

// Types
export type MessageUser = {
  id: string;
  name: string | null;
  avatarUrl: string | null;
  email?: string;
};

export type Message = {
  id: string;
  threadId: string;
  senderId: string;
  content: string | null;
  mediaUrl: string | null;
  isRead: boolean;
  createdAt: string;
  sender: MessageUser;
};

export type Thread = {
  threadId: string;
  otherUser: MessageUser;
  lastMessage: Message | null;
  unreadCount: number;
  lastMessageAt: string;
  createdAt: string;
};

export type ThreadDetail = {
  threadId: string;
  otherUser: MessageUser;
  unreadCount: number;
};

export type MessagesResponse = {
  messages: Message[];
  nextCursor: string | null;
};

export type CreateThreadResponse = {
  threadId: string;
  otherUser: MessageUser;
  isNew: boolean;
};

// API Functions
export async function getThreads(): Promise<Thread[]> {
  return fetchJSON<Thread[]>('/messages/threads');
}

export async function createThread(recipientId: string): Promise<CreateThreadResponse> {
  return fetchJSON<CreateThreadResponse>('/messages/threads', {
    method: 'POST',
    body: JSON.stringify({ recipientId }),
  });
}

export async function getThread(threadId: string): Promise<ThreadDetail> {
  return fetchJSON<ThreadDetail>(`/messages/threads/${threadId}`);
}

export async function getMessages(
  threadId: string,
  cursor?: string,
  limit?: number
): Promise<MessagesResponse> {
  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);
  if (limit) params.set('limit', limit.toString());

  const query = params.toString() ? `?${params.toString()}` : '';
  return fetchJSON<MessagesResponse>(`/messages/threads/${threadId}/messages${query}`);
}

export async function sendMessage(
  threadId: string,
  content?: string,
  mediaUrl?: string
): Promise<Message> {
  return fetchJSON<Message>(`/messages/threads/${threadId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content, mediaUrl }),
  });
}

export async function markThreadAsRead(threadId: string): Promise<{ success: boolean }> {
  return fetchJSON<{ success: boolean }>(`/messages/threads/${threadId}/read`, {
    method: 'POST',
  });
}
