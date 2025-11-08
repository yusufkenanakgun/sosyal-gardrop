'use client';

import { TopBar } from '@/components/layout';
import { Button } from '@/components/ui';
import { PostCard } from '@/components/post';
import { useState, useEffect, useCallback } from 'react';
import { getSavedPosts, deletePost, type Post } from '@/lib/api/posts';

export default function SavedPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const loadSavedPosts = useCallback(async (cursor?: string) => {
    try {
      if (cursor) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      const data = await getSavedPosts(cursor);

      if (cursor) {
        setPosts((prev) => [...prev, ...data.posts]);
      } else {
        setPosts(data.posts);
      }

      setNextCursor(data.nextCursor);
    } catch (error) {
      console.error('Failed to load saved posts:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadSavedPosts();
  }, [loadSavedPosts]);

  const handleDelete = async (postId: string) => {
    try {
      await deletePost(postId);
      setPosts((prev) => prev.filter((p) => p.postId !== postId));
    } catch (error) {
      console.error('Failed to delete post:', error);
      alert('Failed to delete post');
    }
  };

  const handleSaveChange = (postId: string, isSaved: boolean) => {
    if (!isSaved) {
      // Unsaved - remove from list
      setPosts((prev) => prev.filter((p) => p.postId !== postId));
    }
  };

  return (
    <>
      <TopBar />

      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Saved Posts</h1>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading saved posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔖</div>
            <p className="text-gray-500 mb-2">No saved posts yet</p>
            <p className="text-sm text-gray-400">
              Save posts to see them here!
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard
                  key={post.postId}
                  post={post}
                  onDelete={handleDelete}
                  onSaveChange={handleSaveChange}
                />
              ))}
            </div>

            {/* Load more */}
            {nextCursor && (
              <div className="text-center mt-6">
                <Button
                  variant="secondary"
                  onClick={() => loadSavedPosts(nextCursor)}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? 'Loading...' : 'Load More'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
