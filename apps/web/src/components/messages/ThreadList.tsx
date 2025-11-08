'use client';

import { Avatar, Input, Modal } from '@/components/ui';
import type { Thread } from '@/lib/api/messages';
import { formatDistanceToNow } from 'date-fns';
import { useState, useEffect } from 'react';
import { searchUsers, getSuggestedUsers, type UserSearchResult } from '@/lib/api/users';
import { useRouter } from 'next/navigation';

type Props = {
  threads: Thread[];
  selectedThreadId: string | null;
  onSelectThread: (threadId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isLoading?: boolean;
};

export function ThreadList({
  threads,
  selectedThreadId,
  onSelectThread,
  searchQuery,
  onSearchChange,
  isLoading,
}: Props) {
  const router = useRouter();
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Load suggested users when modal opens
  useEffect(() => {
    if (isNewMessageOpen && suggestedUsers.length === 0) {
      const loadSuggested = async () => {
        try {
          const users = await getSuggestedUsers();
          setSuggestedUsers(users);
        } catch (error) {
          console.error('Failed to load suggested users:', error);
        }
      };
      loadSuggested();
    }
  }, [isNewMessageOpen, suggestedUsers.length]);

  // Search users with debounce
  useEffect(() => {
    if (!userSearchQuery || userSearchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const timeout = setTimeout(async () => {
      try {
        const results = await searchUsers(userSearchQuery.trim());
        setSearchResults(results);
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [userSearchQuery]);

  const handleUserSelect = (userId: string) => {
    setIsNewMessageOpen(false);
    setUserSearchQuery('');
    setSearchResults([]);
    router.push(`/messages?userId=${userId}`);
  };

  const filteredThreads = threads.filter((thread) =>
    thread.otherUser.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    thread.otherUser.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    thread.lastMessage?.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full lg:w-96 border-r border-gray-200 flex flex-col bg-white">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Messages</h2>
          <button
            onClick={() => setIsNewMessageOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            title="New message"
          >
            <span className="text-2xl">✏️</span>
          </button>
        </div>
        <Input
          type="text"
          placeholder="Search messages..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          fullWidth
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500">Loading...</div>
        ) : filteredThreads.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {searchQuery ? 'No threads found' : 'No conversations yet'}
          </div>
        ) : (
          filteredThreads.map((thread) => {
            const timeAgo = thread.lastMessageAt
              ? formatDistanceToNow(new Date(thread.lastMessageAt), { addSuffix: true })
              : '';

            return (
              <button
                key={thread.threadId}
                onClick={() => onSelectThread(thread.threadId)}
                className={`w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors ${
                  selectedThreadId === thread.threadId ? 'bg-gray-100' : ''
                }`}
              >
                <div className="relative">
                  <Avatar
                    alt={thread.otherUser.name || 'User'}
                    size="md"
                    src={thread.otherUser.avatarUrl || undefined}
                  />
                  {thread.unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
                      <span className="text-xs text-white font-bold">{thread.unreadCount}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between mb-1">
                    <p
                      className={`text-sm truncate ${thread.unreadCount > 0 ? 'font-semibold' : ''}`}
                    >
                      {thread.otherUser.name || thread.otherUser.email}
                    </p>
                    <span className="text-xs text-gray-500">{timeAgo}</span>
                  </div>
                  <p
                    className={`text-sm truncate ${
                      thread.unreadCount > 0 ? 'font-semibold text-gray-900' : 'text-gray-500'
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

      {/* New Message Modal */}
      <Modal
        isOpen={isNewMessageOpen}
        onClose={() => {
          setIsNewMessageOpen(false);
          setUserSearchQuery('');
          setSearchResults([]);
        }}
        title="New Message"
      >
        <div className="space-y-4">
          {/* Search Input */}
          <Input
            type="text"
            placeholder="Search users..."
            value={userSearchQuery}
            onChange={(e) => setUserSearchQuery(e.target.value)}
            fullWidth
            autoFocus
          />

          {/* Results */}
          <div className="max-h-96 overflow-y-auto space-y-2">
            {userSearchQuery.length === 0 ? (
              // Show suggested users
              suggestedUsers.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">
                  No suggested users
                </p>
              ) : (
                <>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                    Suggested
                  </p>
                  {suggestedUsers.map((user) => (
                    <button
                      key={user.userId}
                      onClick={() => handleUserSelect(user.userId)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <Avatar
                        src={user.avatarUrl || undefined}
                        alt={user.name || user.email}
                        size="md"
                      />
                      <div className="flex-1 text-left">
                        <p className="font-semibold text-sm">{user.name || 'Anonymous'}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </button>
                  ))}
                </>
              )
            ) : isSearching ? (
              <p className="text-gray-500 text-sm text-center py-4">Searching...</p>
            ) : searchResults.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">No users found</p>
            ) : (
              searchResults.map((user) => (
                <button
                  key={user.userId}
                  onClick={() => handleUserSelect(user.userId)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Avatar
                    src={user.avatarUrl || undefined}
                    alt={user.name || user.email}
                    size="md"
                  />
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-sm">{user.name || 'Anonymous'}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                    {user.bio && <p className="text-xs text-gray-400 mt-0.5">{user.bio}</p>}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
