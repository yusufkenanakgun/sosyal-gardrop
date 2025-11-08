'use client';

import { useEffect, useState } from 'react';
import { getUserPosts, type Post } from '@/lib/api/posts';
import { Card, Button } from '../ui';

interface PostsGridProps {
  userId?: string;
}

export function PostsGrid({ userId }: PostsGridProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const loadPosts = async () => {
      try {
        setIsLoading(true);
        const data = await getUserPosts(userId);
        setPosts(data.posts);
        setNextCursor(data.nextCursor);
      } catch (error) {
        console.error('Failed to load posts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPosts();
  }, [userId]);

  const loadMore = async () => {
    if (!userId || !nextCursor || isLoadingMore) return;

    try {
      setIsLoadingMore(true);
      const data = await getUserPosts(userId, nextCursor);
      setPosts((prev) => [...prev, ...data.posts]);
      setNextCursor(data.nextCursor);
    } catch (error) {
      console.error('Failed to load more posts:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handlePostClick = (postId: string) => {
    // For now, just log - we'll implement post detail view in Part B
    console.log('Post clicked:', postId);
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Loading posts...</p>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📸</div>
        <p className="text-gray-500 mb-2">No posts yet</p>
        <p className="text-sm text-gray-400">Start sharing your style!</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-1 sm:gap-4 mt-4">
        {posts.map((post) => (
          <Card
            key={post.postId}
            hover
            className="relative overflow-hidden p-0 cursor-pointer group"
            onClick={() => handlePostClick(post.postId)}
          >
            {post.mediaUrls && post.mediaUrls.length > 0 ? (
              <div className="relative w-full aspect-square bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.mediaUrls[0]}
                  alt={post.caption || 'Post'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23f3f4f6" width="400" height="400"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="18" dy="50%25" dx="50%25" text-anchor="middle"%3EImage%3C/text%3E%3C/svg%3E';
                  }}
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 text-white">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">❤️</span>
                    <span className="font-semibold">{post.likesCount}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">💬</span>
                    <span className="font-semibold">{post.commentsCount}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative w-full aspect-square bg-gradient-to-br from-purple-200 via-pink-200 to-blue-200 flex items-center justify-center">
                <div className="text-center p-4">
                  <span className="text-4xl mb-2 block">📝</span>
                  <p className="text-sm text-gray-700 line-clamp-3">{post.caption}</p>
                </div>
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 text-white">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">❤️</span>
                    <span className="font-semibold">{post.likesCount}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">💬</span>
                    <span className="font-semibold">{post.commentsCount}</span>
                  </div>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Load more */}
      {nextCursor && (
        <div className="text-center mt-6">
          <Button variant="secondary" onClick={loadMore} disabled={isLoadingMore}>
            {isLoadingMore ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}
    </>
  );
}
