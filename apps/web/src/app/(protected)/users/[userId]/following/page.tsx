'use client';

import { TopBar } from '@/components/layout';
import { Avatar, Button } from '@/components/ui';
import { useState, useEffect } from 'react';
import { getFollowing, followUser, unfollowUser, type FollowUser } from '@/lib/api/users';
import { useParams, useRouter } from 'next/navigation';

export default function FollowingPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;

  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followingStates, setFollowingStates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadFollowing = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getFollowing(userId);
        setFollowing(data);

        // Initialize following states
        const states: Record<string, boolean> = {};
        data.forEach((user) => {
          states[user.userId] = user.isFollowing;
        });
        setFollowingStates(states);
      } catch (err) {
        console.error('Failed to load following:', err);
        setError('Failed to load following users');
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      loadFollowing();
    }
  }, [userId]);

  const handleFollowToggle = async (followUserId: string) => {
    const isCurrentlyFollowing = followingStates[followUserId];

    try {
      if (isCurrentlyFollowing) {
        await unfollowUser(followUserId);
        setFollowingStates({ ...followingStates, [followUserId]: false });
      } else {
        await followUser(followUserId);
        setFollowingStates({ ...followingStates, [followUserId]: true });
      }
    } catch (error) {
      console.error('Failed to toggle follow:', error);
      alert('Failed to update follow status');
    }
  };

  return (
    <>
      <TopBar />

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => router.back()} className="text-2xl">
            ←
          </button>
          <h1 className="text-xl font-semibold">Following</h1>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="text-center py-8">Loading...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : following.length === 0 ? (
          <div className="text-center py-12 text-gray-500">Not following anyone yet</div>
        ) : (
          <div className="space-y-3">
            {following.map((user) => (
              <div
                key={user.userId}
                className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg"
              >
                <button
                  onClick={() => router.push(`/users/${user.userId}`)}
                  className="flex items-center gap-3 flex-1"
                >
                  <Avatar
                    src={user.avatarUrl || undefined}
                    alt={user.name || user.email}
                    size="md"
                  />
                  <div className="text-left">
                    <p className="font-semibold text-sm">{user.name || 'Anonymous'}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                    {user.bio && (
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{user.bio}</p>
                    )}
                  </div>
                </button>

                <Button
                  variant={followingStates[user.userId] ? 'secondary' : 'primary'}
                  size="sm"
                  onClick={() => handleFollowToggle(user.userId)}
                >
                  {followingStates[user.userId] ? 'Following' : 'Follow'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
