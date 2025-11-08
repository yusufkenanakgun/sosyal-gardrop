'use client';

import { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { getAccessToken } from '@/lib/api/session';
import type { Message } from '@/lib/api/messages';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  error: string | null;
  joinThread: (threadId: string) => void;
  leaveThread: (threadId: string) => void;
  sendMessage: (threadId: string, content?: string, mediaUrl?: string) => void;
  markRead: (threadId: string) => void;
  startTyping: (threadId: string) => void;
  stopTyping: (threadId: string) => void;
  onNewMessage: (callback: (message: Message) => void) => () => void;
  onThreadUpdated: (callback: (data: { threadId: string; lastMessage: Message }) => void) => () => void;
  onUserTyping: (callback: (data: { threadId: string; userId: string }) => void) => () => void;
  onUserStoppedTyping: (callback: (data: { threadId: string; userId: string }) => void) => () => void;
  onMessagesRead: (callback: (data: { threadId: string; userId: string }) => void) => () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setError('No authentication token');
      return;
    }

    // Only create socket if it doesn't exist
    if (!socketRef.current) {
      const socket = io(`${SOCKET_URL}/messages`, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('Socket connected');
        setIsConnected(true);
        setError(null);
      });

      socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setIsConnected(false);
      });

      socket.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
        setError(err.message);
        setIsConnected(false);
      });
    }

    // Don't close socket on unmount - keep it alive for the whole app
    return () => {
      // Only cleanup when the app is actually closing
    };
  }, []);

  const joinThread = useCallback((threadId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('join_thread', { threadId });
    }
  }, []);

  const leaveThread = useCallback((threadId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('leave_thread', { threadId });
    }
  }, []);

  const sendMessage = useCallback(
    (threadId: string, content?: string, mediaUrl?: string) => {
      if (socketRef.current) {
        socketRef.current.emit('send_message', { threadId, content, mediaUrl });
      }
    },
    []
  );

  const markRead = useCallback((threadId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('mark_read', { threadId });
    }
  }, []);

  const startTyping = useCallback((threadId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('typing_start', { threadId });
    }
  }, []);

  const stopTyping = useCallback((threadId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('typing_stop', { threadId });
    }
  }, []);

  const onNewMessage = useCallback((callback: (message: Message) => void) => {
    if (socketRef.current) {
      socketRef.current.on('new_message', callback);
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.off('new_message', callback);
      }
    };
  }, []);

  const onThreadUpdated = useCallback(
    (callback: (data: { threadId: string; lastMessage: Message }) => void) => {
      if (socketRef.current) {
        socketRef.current.on('thread_updated', callback);
      }
      return () => {
        if (socketRef.current) {
          socketRef.current.off('thread_updated', callback);
        }
      };
    },
    []
  );

  const onUserTyping = useCallback((callback: (data: { threadId: string; userId: string }) => void) => {
    if (socketRef.current) {
      socketRef.current.on('user_typing', callback);
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.off('user_typing', callback);
      }
    };
  }, []);

  const onUserStoppedTyping = useCallback((callback: (data: { threadId: string; userId: string }) => void) => {
    if (socketRef.current) {
      socketRef.current.on('user_stopped_typing', callback);
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.off('user_stopped_typing', callback);
      }
    };
  }, []);

  const onMessagesRead = useCallback((callback: (data: { threadId: string; userId: string }) => void) => {
    if (socketRef.current) {
      socketRef.current.on('messages_read', callback);
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.off('messages_read', callback);
      }
    };
  }, []);

  const value: SocketContextType = {
    socket: socketRef.current,
    isConnected,
    error,
    joinThread,
    leaveThread,
    sendMessage,
    markRead,
    startTyping,
    stopTyping,
    onNewMessage,
    onThreadUpdated,
    onUserTyping,
    onUserStoppedTyping,
    onMessagesRead,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
