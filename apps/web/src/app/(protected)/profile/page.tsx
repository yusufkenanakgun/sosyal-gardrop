'use client';

import { TopBar } from '@/components/layout';
import { Avatar, Button, Modal } from '@/components/ui';
import { PostsGrid } from '@/components/post';
import { useEffect, useState } from 'react';
import { getMyProfile, updateMyProfile, uploadAvatar, type UserProfile } from '@/lib/api/users';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'posts' | 'saved' | 'tagged'>('posts');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await getMyProfile();
      setProfile(data);
      setEditName(data.name || '');
      setEditBio(data.bio || '');
    } catch (e) {
      console.error('Failed to load profile:', e);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;

    try {
      setIsSaving(true);
      await updateMyProfile({
        name: editName.trim() || undefined,
        bio: editBio.trim() || undefined,
      });
      await loadProfile();
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    try {
      setIsUploadingAvatar(true);
      setUploadProgress(0);

      await uploadAvatar(file, (progress) => {
        setUploadProgress(progress);
      });

      await loadProfile();
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      alert('Failed to upload avatar');
    } finally {
      setIsUploadingAvatar(false);
      setUploadProgress(0);
    }
  };

  return (
    <>
      <TopBar />

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Profile Header */}
        <div className="mb-8">
          <div className="flex items-start gap-6 mb-6">
            <div className="relative">
              <Avatar
                src={profile?.avatarUrl || undefined}
                alt={profile?.name || profile?.email || 'User'}
                size="xl"
              />
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full border-2 border-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-50"
              >
                {isUploadingAvatar ? (
                  <span className="text-xs">{Math.round(uploadProgress)}%</span>
                ) : (
                  <span className="text-sm">📷</span>
                )}
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                disabled={isUploadingAvatar}
                className="hidden"
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <h1 className="text-2xl font-semibold">
                  {profile?.name || profile?.email?.split('@')[0] || 'username'}
                </h1>
                <Button variant="secondary" size="sm" onClick={() => setIsEditModalOpen(true)}>
                  Edit Profile
                </Button>
              </div>

              {/* Stats */}
              <div className="flex gap-8 mb-4">
                <div>
                  <span className="font-semibold">{profile?.postsCount || 0}</span>{' '}
                  <span className="text-gray-600">Posts</span>
                </div>
                <button
                  className="hover:opacity-70"
                  onClick={() => profile?.userId && router.push(`/users/${profile.userId}/followers`)}
                >
                  <span className="font-semibold">{profile?.followersCount || 0}</span>{' '}
                  <span className="text-gray-600">Followers</span>
                </button>
                <button
                  className="hover:opacity-70"
                  onClick={() => profile?.userId && router.push(`/users/${profile.userId}/following`)}
                >
                  <span className="font-semibold">{profile?.followingCount || 0}</span>{' '}
                  <span className="text-gray-600">Following</span>
                </button>
              </div>

              {/* Bio */}
              {profile?.bio && (
                <div className="text-sm">
                  <p className="whitespace-pre-wrap">{profile.bio}</p>
                </div>
              )}
            </div>
          </div>

          {/* Story Highlights */}
          <div className="flex gap-4 overflow-x-auto pb-4">
            {['Favorites', 'Summer', 'Winter', 'Casual'].map((highlight) => (
              <div key={highlight} className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-full border-2 border-gray-300 flex items-center justify-center bg-gray-100 cursor-pointer hover:border-gray-400">
                  <span className="text-2xl">👕</span>
                </div>
                <span className="text-xs text-gray-600">{highlight}</span>
              </div>
            ))}
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-full border-2 border-gray-300 flex items-center justify-center bg-gray-50 cursor-pointer hover:border-gray-400">
                <span className="text-2xl text-gray-400">+</span>
              </div>
              <span className="text-xs text-gray-600">New</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-t border-gray-200">
          <div className="flex justify-center gap-12">
            {(['posts', 'saved', 'tagged'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 text-sm font-semibold uppercase tracking-wide transition-colors ${
                  activeTab === tab
                    ? 'text-black border-t-2 border-black -mt-px'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {tab === 'posts' ? '📱 Posts' : tab === 'saved' ? '🔖 Saved' : '👤 Tagged'}
              </button>
            ))}
          </div>
        </div>

        {/* Posts Grid */}
        {activeTab === 'posts' && (
          <PostsGrid userId={profile?.userId} />
        )}

        {activeTab === 'saved' && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔖</div>
            <p className="text-gray-500 mb-2">Saved Posts</p>
            <Button
              variant="primary"
              onClick={() => router.push('/saved')}
            >
              View Saved Posts
            </Button>
          </div>
        )}

        {activeTab === 'tagged' && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👤</div>
            <p className="text-gray-500 mb-2">No tagged posts yet</p>
            <p className="text-sm text-gray-400">Feature coming soon!</p>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Profile"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Your name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Bio</label>
            <textarea
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              placeholder="Tell us about yourself"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => setIsEditModalOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveProfile}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
