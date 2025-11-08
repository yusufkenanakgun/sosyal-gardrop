'use client';

import { TopBar } from '@/components/layout';
import { Avatar } from '@/components/ui';
import { useState, useEffect } from 'react';
import { searchUsers, getSuggestedUsers, type UserSearchResult } from '@/lib/api/users';
import { useRouter } from 'next/navigation';

export default function SearchPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<UserSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load suggested users on mount
  useEffect(() => {
    const loadSuggested = async () => {
      try {
        const users = await getSuggestedUsers();
        setSuggestedUsers(users);
      } catch (error) {
        console.error('Failed to load suggested users:', error);
      }
    };
    loadSuggested();
  }, []);

  // Search users with debounce
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setShowResults(true);
    setIsLoading(true);

    const timeout = setTimeout(async () => {
      try {
        const results = await searchUsers(searchQuery.trim());
        setSearchResults(results);
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const handleUserClick = (userId: string) => {
    router.push(`/users/${userId}`);
  };

  return (
    <>
      <TopBar />

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Search Input */}
        <div className="mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowResults(e.target.value.length > 0);
            }}
            placeholder="Search"
            className="w-full px-4 py-3 rounded-xl bg-gray-100 border-0 focus:outline-none focus:ring-2 focus:ring-purple-500"
            autoFocus
          />
        </div>

        {!showResults ? (
          <div className="space-y-6">
            {/* Suggested Users */}
            <div>
              <h2 className="font-semibold mb-3">Suggested</h2>
              {suggestedUsers.length === 0 ? (
                <p className="text-gray-500 text-sm">No suggestions available</p>
              ) : (
                <div className="space-y-2">
                  {suggestedUsers.map((user) => (
                    <button
                      key={user.userId}
                      onClick={() => handleUserClick(user.userId)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <Avatar src={user.avatarUrl || undefined} alt={user.name || user.email} size="md" />
                      <div className="flex-1 text-left">
                        <p className="font-semibold text-sm">{user.name || 'Anonymous'}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Search Results */}
            <div>
              <h2 className="font-semibold mb-3">Accounts</h2>
              {isLoading ? (
                <p className="text-gray-500 text-sm">Searching...</p>
              ) : searchResults.length === 0 ? (
                <p className="text-gray-500 text-sm">No users found</p>
              ) : (
                <div className="space-y-2">
                  {searchResults.map((user) => (
                    <button
                      key={user.userId}
                      onClick={() => handleUserClick(user.userId)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <Avatar src={user.avatarUrl || undefined} alt={user.name || user.email} size="md" />
                      <div className="flex-1 text-left">
                        <p className="font-semibold text-sm">{user.name || 'Anonymous'}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                        {user.bio && <p className="text-xs text-gray-400 mt-0.5">{user.bio}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
