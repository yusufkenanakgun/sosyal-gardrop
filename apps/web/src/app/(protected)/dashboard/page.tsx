'use client';

import { TopBar, StoryBar } from '@/components/layout';
import { Button } from '@/components/ui';
import { PostCard, CreatePostModal } from '@/components/post';
import { useState, useEffect, useCallback } from 'react';
import { getFeed, deletePost, type Post } from '@/lib/api/posts';
import { getMyProfile, type UserProfile } from '@/lib/api/users';

export default function DashboardPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const loadFeed = useCallback(async (cursor?: string) => {
    try {
      if (cursor) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      const data = await getFeed(cursor);

      if (cursor) {
        setPosts((prev) => [...prev, ...data.posts]);
      } else {
        setPosts(data.posts);
      }

      setNextCursor(data.nextCursor);
    } catch (error) {
      console.error('Failed to load feed:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      const data = await getMyProfile();
      setProfile(data);
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  }, []);

  useEffect(() => {
    loadFeed();
    loadProfile();
  }, [loadFeed, loadProfile]);

  const handleDelete = async (postId: string) => {
    try {
      await deletePost(postId);
      setPosts((prev) => prev.filter((p) => p.postId !== postId));
    } catch (error) {
      console.error('Failed to delete post:', error);
      alert('Failed to delete post');
    }
  };

  const handleCreateSuccess = () => {
    loadFeed();
  };

  return (
    <>
      <TopBar />

      <div className="max-w-2xl mx-auto">
        <StoryBar />

        <div className="px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Your Feed</h1>
            <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
              Create Post
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading feed...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📸</div>
              <p className="text-gray-500 mb-2">No posts yet</p>
              <p className="text-sm text-gray-400 mb-4">
                Follow users or create your first post!
              </p>
              <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
                Create Post
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {posts.map((post) => (
                  <PostCard key={post.postId} post={post} onDelete={handleDelete} />
                ))}
              </div>

              {/* Load more */}
              {nextCursor && (
                <div className="text-center mt-6">
                  <Button
                    variant="secondary"
                    onClick={() => loadFeed(nextCursor)}
                    disabled={isLoadingMore}
                  >
                    {isLoadingMore ? 'Loading...' : 'Load More'}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
        userAvatar={profile?.avatarUrl}
        userName={profile?.name || undefined}
      />
    </>
  );
}
