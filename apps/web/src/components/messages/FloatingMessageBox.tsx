'use client';

import { useState, useEffect } from 'react';
import { Avatar } from '@/components/ui';
import { getThreads, type Thread } from '@/lib/api/messages';
import { useSocket } from '@/hooks/useSocket';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { playMessageSound, showBrowserNotification } from '@/lib/notification';
import { getCurrentUserId } from '@/lib/api/session';

export function FloatingMessageBox() {
  const [isOpen, setIsOpen] = useState(false);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const socket = useSocket();

  // Load threads on mount (to get initial unread count)
  useEffect(() => {
    loadThreads();
  }, []);

  // Load threads when box opens
  useEffect(() => {
    if (isOpen) {
      loadThreads();
    }
  }, [isOpen]);

  // Calculate total unread count
  useEffect(() => {
    const total = threads.reduce((sum, thread) => sum + thread.unreadCount, 0);
    setUnreadCount(total);
  }, [threads]);

  // Listen for new messages - update threads in real-time
  useEffect(() => {
    if (!socket.isConnected) return;

    const cleanup = socket.onThreadUpdated((data) => {
      const currentUserId = getCurrentUserId();

      // Play sound and show notification if message is from another user
      if (data.lastMessage.senderId !== currentUserId) {
        playMessageSound();

        // Show browser notification
        const senderName = data.lastMessage.sender?.name || 'Someone';
        showBrowserNotification(
          `New message from ${senderName}`,
          data.lastMessage.content || 'Sent a message',
          data.lastMessage.sender?.avatarUrl || undefined
        );
      }

      // Update thread in state
      setThreads((prevThreads) => {
        const threadIndex = prevThreads.findIndex((t) => t.threadId === data.threadId);
        if (threadIndex >= 0) {
          const updatedThreads = [...prevThreads];
          const isFromOtherUser = data.lastMessage.senderId !== currentUserId;
          updatedThreads[threadIndex] = {
            ...updatedThreads[threadIndex],
            lastMessage: data.lastMessage,
            lastMessageAt: data.lastMessage.createdAt,
            unreadCount: isFromOtherUser
              ? updatedThreads[threadIndex].unreadCount + 1
              : updatedThreads[threadIndex].unreadCount,
          };
          // Move to top
          const [thread] = updatedThreads.splice(threadIndex, 1);
          return [thread, ...updatedThreads];
        } else {
          // New thread, reload all
          loadThreads();
          return prevThreads;
        }
      });
    });

    return cleanup;
  }, [socket]);

  const loadThreads = async () => {
    try {
      setIsLoading(true);
      const data = await getThreads();
      setThreads(data.slice(0, 5)); // Show only 5 most recent threads
    } catch (error) {
      console.error('Failed to load threads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleThreadClick = () => {
    router.push('/messages');
    setIsOpen(false);
  };

  const handleViewAll = () => {
    router.push('/messages');
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
        aria-label="Messages"
      >
        <svg
          className="w-6 h-6 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1 bg-red-500 text-white text-xs font-bold rounded-full border-2 border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </button>

      {/* Message Box */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 max-h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">Messages</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-purple-100 text-purple-600 text-xs font-semibold rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          {/* Threads List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              </div>
            ) : threads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="text-5xl mb-3">💬</div>
                <p className="text-gray-500 text-sm text-center">No messages yet</p>
                <p className="text-gray-400 text-xs text-center mt-1">
                  Start a conversation with someone
                </p>
              </div>
            ) : (
              threads.map((thread) => {
                const timeAgo = thread.lastMessageAt
                  ? formatDistanceToNow(new Date(thread.lastMessageAt), { addSuffix: true })
                      .replace('about ', '')
                      .replace(' ago', '')
                  : '';

                return (
                  <button
                    key={thread.threadId}
                    onClick={() => handleThreadClick()}
                    className="w-full flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                  >
                    <div className="relative flex-shrink-0">
                      <Avatar
                        alt={thread.otherUser.name || 'User'}
                        size="md"
                        src={thread.otherUser.avatarUrl || undefined}
                      />
                      {thread.unreadCount > 0 && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center border-2 border-white">
                          <span className="text-white text-xs font-bold">
                            {thread.unreadCount}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between mb-1">
                        <p
                          className={`text-sm truncate ${
                            thread.unreadCount > 0 ? 'font-semibold' : 'font-medium'
                          }`}
                        >
                          {thread.otherUser.name || thread.otherUser.email}
                        </p>
                        <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                          {timeAgo}
                        </span>
                      </div>
                      <p
                        className={`text-xs truncate ${
                          thread.unreadCount > 0
                            ? 'text-gray-900 font-medium'
                            : 'text-gray-500'
                        }`}
                      >
                        {thread.lastMessage?.content || 'No messages yet'}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          {threads.length > 0 && (
            <div className="border-t border-gray-200 bg-gray-50">
              <button
                onClick={handleViewAll}
                className="w-full py-3 text-sm font-semibold text-purple-600 hover:text-purple-700 transition-colors"
              >
                View All Messages
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
