'use client';

import { TopBar } from '@/components/layout';
import { Avatar, Button } from '@/components/ui';
import { PostsGrid } from '@/components/post';
import { useState, useEffect } from 'react';
import { getUserProfile, followUser, unfollowUser, type UserProfile } from '@/lib/api/users';
import { useParams, useRouter } from 'next/navigation';

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getUserProfile(userId);
        setProfile(data);
      } catch (err) {
        console.error('Failed to load profile:', err);
        setError('Failed to load user profile');
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      loadProfile();
    }
  }, [userId]);

  const handleFollowToggle = async () => {
    if (!profile || isFollowLoading) return;

    try {
      setIsFollowLoading(true);

      if (profile.isFollowing) {
        await unfollowUser(userId);
        setProfile({ ...profile, isFollowing: false, followersCount: profile.followersCount - 1 });
      } else {
        await followUser(userId);
        setProfile({ ...profile, isFollowing: true, followersCount: profile.followersCount + 1 });
      }
    } catch (error) {
      console.error('Failed to toggle follow:', error);
      alert('Failed to update follow status');
    } finally {
      setIsFollowLoading(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <TopBar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </>
    );
  }

  if (error || !profile) {
    return (
      <>
        <TopBar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center text-red-500">{error || 'User not found'}</div>
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="flex items-start gap-8 mb-8">
          <Avatar src={profile.avatarUrl || undefined} alt={profile.name || profile.email} size="xl" />

          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <h1 className="text-2xl font-semibold">{profile.name || 'Anonymous'}</h1>
              {profile.isOwnProfile ? (
                <Button
                  variant="secondary"
                  onClick={() => router.push('/profile')}
                >
                  Edit Profile
                </Button>
              ) : (
                <Button
                  variant={profile.isFollowing ? 'secondary' : 'primary'}
                  onClick={handleFollowToggle}
                  disabled={isFollowLoading}
                >
                  {isFollowLoading ? 'Loading...' : profile.isFollowing ? 'Following' : 'Follow'}
                </Button>
              )}
              {!profile.isOwnProfile && (
                <Button
                  variant="secondary"
                  onClick={() => router.push(`/messages?userId=${userId}`)}
                >
                  Message
                </Button>
              )}
            </div>

            {/* Stats */}
            <div className="flex gap-8 mb-4">
              <div>
                <span className="font-semibold">{profile.postsCount}</span>{' '}
                <span className="text-gray-600">posts</span>
              </div>
              <button
                className="hover:opacity-70"
                onClick={() => router.push(`/users/${userId}/followers`)}
              >
                <span className="font-semibold">{profile.followersCount}</span>{' '}
                <span className="text-gray-600">followers</span>
              </button>
              <button
                className="hover:opacity-70"
                onClick={() => router.push(`/users/${userId}/following`)}
              >
                <span className="font-semibold">{profile.followingCount}</span>{' '}
                <span className="text-gray-600">following</span>
              </button>
            </div>

            {/* Bio */}
            {profile.bio && (
              <div className="text-sm">
                <p className="whitespace-pre-wrap">{profile.bio}</p>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-t border-gray-300">
          <div className="flex justify-center gap-12 -mb-px">
            <button className="py-3 border-t border-black font-semibold text-sm flex items-center gap-2">
              <span>📷</span>
              POSTS
            </button>
            <button className="py-3 text-gray-400 font-semibold text-sm flex items-center gap-2">
              <span>👗</span>
              WARDROBE
            </button>
          </div>
        </div>

        {/* Posts Grid */}
        <PostsGrid userId={userId} />
      </div>
    </>
  );
}
