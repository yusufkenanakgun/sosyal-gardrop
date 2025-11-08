'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Avatar, Input } from '@/components/ui';
import type { Message, MessageUser } from '@/lib/api/messages';
import { getMessages, sendMessage as sendMessageApi, markThreadAsRead } from '@/lib/api/messages';
import { useSocket } from '@/hooks/useSocket';
import { formatDistanceToNow } from 'date-fns';
import { playMessageSound } from '@/lib/notification';

type Props = {
  threadId: string;
  otherUser: MessageUser;
  currentUserId: string;
};

export function ChatView({ threadId, otherUser, currentUserId }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const socket = useSocket();

  // Load messages
  useEffect(() => {
    let mounted = true;

    const loadMessages = async () => {
      try {
        setIsLoading(true);
        const data = await getMessages(threadId);
        if (mounted) {
          setMessages(data.messages);
        }
      } catch (error) {
        console.error('Failed to load messages:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadMessages();

    return () => {
      mounted = false;
    };
  }, [threadId]);

  // Join thread and mark as read
  useEffect(() => {
    if (socket.isConnected) {
      socket.joinThread(threadId);
      markThreadAsRead(threadId).catch(console.error);
    }

    return () => {
      if (socket.isConnected) {
        socket.leaveThread(threadId);
      }
    };
  }, [threadId, socket]);

  // Listen for new messages
  useEffect(() => {
    const cleanup = socket.onNewMessage((message: Message) => {
      if (message.threadId === threadId) {
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m.id === message.id)) {
            return prev;
          }
          return [...prev, message];
        });

        // Play sound and mark as read if it's from other user
        if (message.senderId !== currentUserId) {
          playMessageSound();
          markThreadAsRead(threadId).catch(console.error);
        }
      }
    });

    return cleanup;
  }, [threadId, currentUserId, socket]);

  // Listen for typing indicators
  useEffect(() => {
    const cleanupTyping = socket.onUserTyping((data) => {
      if (data.threadId === threadId && data.userId !== currentUserId) {
        setIsTyping(true);

        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
        }, 3000);
      }
    });

    const cleanupStopTyping = socket.onUserStoppedTyping((data) => {
      if (data.threadId === threadId && data.userId !== currentUserId) {
        setIsTyping(false);
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      }
    });

    return () => {
      cleanupTyping();
      cleanupStopTyping();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [threadId, currentUserId, socket]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleInputChange = useCallback(
    (value: string) => {
      setInputValue(value);

      // Send typing indicators
      if (value && socket.isConnected) {
        socket.startTyping(threadId);

        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
          socket.stopTyping(threadId);
        }, 1000);
      } else if (!value && socket.isConnected) {
        socket.stopTyping(threadId);
      }
    },
    [threadId, socket]
  );

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputValue.trim() || isSending) return;

    const content = inputValue.trim();
    const tempId = `temp-${Date.now()}`;

    // Optimistic UI: Add message immediately
    const optimisticMessage: Message = {
      id: tempId,
      threadId,
      senderId: currentUserId,
      content,
      mediaUrl: null,
      isRead: false,
      createdAt: new Date().toISOString(),
      sender: {
        id: currentUserId,
        name: 'You',
        avatarUrl: null,
      },
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setInputValue('');
    setIsSending(true);

    // Stop typing indicator
    if (socket.isConnected) {
      socket.stopTyping(threadId);
    }

    try {
      // Send via REST API (WebSocket will broadcast the real message)
      const realMessage = await sendMessageApi(threadId, content);

      // Replace optimistic message with real one
      setMessages((prev) =>
        prev.map((msg) => (msg.id === tempId ? realMessage : msg))
      );
    } catch (error) {
      console.error('Failed to send message:', error);

      // Remove optimistic message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));

      // Restore input
      setInputValue(content);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Thread Header */}
      <div className="p-4 border-b border-gray-200 flex items-center gap-3 bg-white">
        <div className="relative">
          <Avatar alt={otherUser.name || 'User'} size="md" src={otherUser.avatarUrl || undefined} />
          {socket.isConnected && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
          )}
        </div>
        <div className="flex-1">
          <p className="font-semibold">{otherUser.name || otherUser.email}</p>
          {isTyping ? (
            <p className="text-xs text-purple-500 flex items-center gap-1">
              <span className="flex gap-0.5">
                <span className="w-1 h-1 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1 h-1 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1 h-1 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </span>
              typing
            </p>
          ) : (
            <p className="text-xs text-gray-500">
              {socket.isConnected ? 'Active now' : 'Offline'}
            </p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="text-center text-gray-500">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500">No messages yet. Start the conversation!</div>
        ) : (
          messages.map((message) => {
            const isOwn = message.senderId === currentUserId;
            const timeAgo = formatDistanceToNow(new Date(message.createdAt), { addSuffix: true });

            const isSending = message.id.startsWith('temp-');

            return (
              <div
                key={message.id}
                className={`flex items-start gap-2 ${isOwn ? 'justify-end' : ''}`}
              >
                {!isOwn && (
                  <Avatar
                    alt={message.sender.name || 'User'}
                    size="sm"
                    src={message.sender.avatarUrl || undefined}
                  />
                )}
                <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`rounded-2xl px-4 py-2 max-w-xs ${
                      isOwn
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    } ${isSending ? 'opacity-70' : ''}`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs text-gray-400">{timeAgo}</span>
                    {isOwn && (
                      <span className="text-xs">
                        {isSending ? (
                          <span className="text-gray-400">⏳</span>
                        ) : message.isRead ? (
                          <span className="text-blue-500" title="Read">✓✓</span>
                        ) : (
                          <span className="text-gray-400" title="Delivered">✓✓</span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="Type a message..."
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e as unknown as React.FormEvent);
              }
            }}
            fullWidth
            disabled={isSending}
            autoFocus
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isSending}
            className="text-2xl hover:opacity-70 disabled:opacity-30 transition-transform hover:scale-110"
            title="Send message (Enter)"
          >
            {isSending ? '⏳' : '📤'}
          </button>
        </div>
      </form>
    </div>
  );
}
