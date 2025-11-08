'use client';

import { TopBar } from '@/components/layout';
import { ThreadList, ChatView } from '@/components/messages';
import { useState, useEffect } from 'react';
import { getThreads, createThread, type Thread } from '@/lib/api/messages';
import { useSocket } from '@/hooks/useSocket';
import { getCurrentUserId } from '@/lib/api/session';
import { fetchJSON } from '@/lib/api/client';
import { useSearchParams } from 'next/navigation';

export default function MessagesPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isCreatingThread, setIsCreatingThread] = useState(false);

  const searchParams = useSearchParams();
  const userIdFromUrl = searchParams.get('userId');

  const socket = useSocket();

  // Load threads on mount
  useEffect(() => {
    let mounted = true;

    const loadThreads = async () => {
      try {
        setIsLoading(true);
        const data = await getThreads();
        if (mounted) {
          setThreads(data);
        }
      } catch (error) {
        console.error('Failed to load threads:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadThreads();

    // Get current user ID from session
    const storedUserId = getCurrentUserId();
    if (storedUserId) {
      setCurrentUserId(storedUserId);
    } else {
      // Fallback: fetch from API
      const getUserId = async () => {
        try {
          const data = await fetchJSON<{ userId: string; email: string }>('/auth/me');
          if (mounted && data.userId) {
            setCurrentUserId(data.userId);
          }
        } catch (error) {
          console.error('Failed to get user ID:', error);
        }
      };
      getUserId();
    }

    return () => {
      mounted = false;
    };
  }, []);

  // Handle userId from URL - create or find thread with that user
  useEffect(() => {
    if (!userIdFromUrl || isLoading) return;

    // Check if we already have a thread with this user
    const existingThread = threads.find((t) => t.otherUser?.id === userIdFromUrl);

    if (existingThread) {
      // Select the existing thread
      console.log('Found existing thread:', existingThread.threadId);
      setSelectedThreadId(existingThread.threadId);
    } else if (!isCreatingThread) {
      // Only create thread if we've loaded threads and don't have one with this user
      const createNewThread = async () => {
        try {
          console.log('Creating new thread with user:', userIdFromUrl);
          setIsCreatingThread(true);
          const result = await createThread(userIdFromUrl);

          console.log('Thread created:', result);

          // Reload threads to get the new one
          const updatedThreads = await getThreads();
          setThreads(updatedThreads);

          // Select the new thread
          setSelectedThreadId(result.threadId);
        } catch (error) {
          console.error('Failed to create thread:', error);
          alert('Failed to create conversation. Please try again.');
        } finally {
          setIsCreatingThread(false);
        }
      };

      createNewThread();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userIdFromUrl, isLoading]);

  // Listen for thread updates
  useEffect(() => {
    if (!socket.isConnected) return;

    const cleanup = socket.onThreadUpdated((data) => {
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
          // New thread arrived, reload all threads
          getThreads().then(setThreads).catch(console.error);
          return prevThreads;
        }
      });
    });

    return cleanup;
  }, [socket, currentUserId]);

  const selectedThread = threads.find((t) => t.threadId === selectedThreadId);

  return (
    <>
      <TopBar />

      <div className="max-w-7xl mx-auto h-[calc(100vh-60px)] lg:h-screen">
        <div className="flex h-full border-t border-gray-200">
          {/* Conversations List - Hide on mobile when thread is selected */}
          <div className={`${selectedThreadId ? 'hidden lg:block' : 'block'} w-full lg:w-auto`}>
            <ThreadList
              threads={threads}
              selectedThreadId={selectedThreadId}
              onSelectThread={setSelectedThreadId}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              isLoading={isLoading}
            />
          </div>

          {/* Message Thread - Show on mobile when thread is selected */}
          <div className={`${selectedThreadId ? 'flex' : 'hidden lg:flex'} flex-1 flex-col bg-white relative`}>
            {selectedThread && currentUserId ? (
              <>
                {/* Back button for mobile */}
                <button
                  onClick={() => setSelectedThreadId(null)}
                  className="lg:hidden absolute top-4 left-4 z-10 w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-md hover:bg-gray-100"
                >
                  ←
                </button>
                <ChatView
                  threadId={selectedThread.threadId}
                  otherUser={selectedThread.otherUser}
                  currentUserId={currentUserId}
                />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">💬</div>
                  <h3 className="text-xl font-semibold mb-2">Your Messages</h3>
                  <p className="text-gray-500">Select a conversation to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
