'use client';

import { TopBar } from '@/components/layout';
import { Avatar, Button } from '@/components/ui';
import { MediaCarousel } from '@/components/post';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  getPostById,
  toggleLike,
  toggleSave,
  addComment,
  getPostComments,
  deletePost,
  type Post,
} from '@/lib/api/posts';

interface Comment {
  commentId: string;
  content: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
  createdAt: string;
  isOwnComment: boolean;
}

export default function PostDetailPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.postId as string;

  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isAddingComment, setIsAddingComment] = useState(false);

  useEffect(() => {
    loadPost();
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const loadPost = async () => {
    try {
      setIsLoading(true);
      const data = await getPostById(postId);
      setPost(data);
      setIsLiked(data.isLiked || false);
      setIsSaved(data.isSaved || false);
      setLikesCount(data.likesCount);
    } catch (error) {
      console.error('Failed to load post:', error);
      alert('Failed to load post');
      router.push('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      setIsLoadingComments(true);
      const data = await getPostComments(postId);
      setComments(data.comments);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleLike = async () => {
    if (isLiking) return;

    try {
      setIsLiking(true);
      const newIsLiked = !isLiked;
      setIsLiked(newIsLiked);
      setLikesCount((prev) => (newIsLiked ? prev + 1 : prev - 1));

      const result = await toggleLike(postId);
      setIsLiked(result.isLiked);
    } catch (error) {
      console.error('Failed to toggle like:', error);
      setIsLiked(!isLiked);
      setLikesCount(likesCount);
    } finally {
      setIsLiking(false);
    }
  };

  const handleSave = async () => {
    if (isSaving) return;

    try {
      setIsSaving(true);
      const newIsSaved = !isSaved;
      setIsSaved(newIsSaved);

      const result = await toggleSave(postId);
      setIsSaved(result.isSaved);
    } catch (error) {
      console.error('Failed to toggle save:', error);
      setIsSaved(!isSaved);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || isAddingComment) return;

    try {
      setIsAddingComment(true);
      const newComment = await addComment(postId, commentInput.trim());
      setComments((prev) => [newComment, ...prev]);
      setCommentInput('');
    } catch (error) {
      console.error('Failed to add comment:', error);
      alert('Failed to add comment');
    } finally {
      setIsAddingComment(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      await deletePost(postId);
      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to delete post:', error);
      alert('Failed to delete post');
    }
  };

  if (isLoading) {
    return (
      <>
        <TopBar />
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="text-center py-12">
            <p className="text-gray-500">Loading post...</p>
          </div>
        </div>
      </>
    );
  }

  if (!post) {
    return (
      <>
        <TopBar />
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="text-center py-12">
            <p className="text-gray-500">Post not found</p>
            <Button variant="primary" onClick={() => router.push('/dashboard')} className="mt-4">
              Go to Dashboard
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar />

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Post Card */}
        <div className="bg-white border border-gray-200 rounded-lg mb-4">
          {/* Header */}
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => router.push(`/users/${post.user.id}`)}
              className="flex items-center gap-3 hover:opacity-70"
            >
              <Avatar
                src={post.user.avatarUrl || undefined}
                alt={post.user.name || post.user.email}
                size="sm"
              />
              <div className="text-left">
                <p className="font-semibold text-sm">{post.user.name || 'Anonymous'}</p>
                <p className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</p>
              </div>
            </button>

            {post.isOwnPost && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <span className="text-xl">⋯</span>
                </button>
                {showMenu && (
                  <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    <button
                      onClick={handleDelete}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 rounded-lg"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Media Carousel */}
          {post.mediaUrls && post.mediaUrls.length > 0 && <MediaCarousel images={post.mediaUrls} />}

          {/* Actions */}
          <div className="px-4 pt-3">
            <div className="flex items-center gap-4 mb-3">
              <button
                onClick={handleLike}
                disabled={isLiking}
                className="hover:opacity-70 transition-opacity disabled:opacity-50"
              >
                <span className="text-2xl">{isLiked ? '❤️' : '🤍'}</span>
              </button>
              <button className="hover:opacity-70 transition-opacity">
                <span className="text-2xl">💬</span>
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="hover:opacity-70 transition-opacity ml-auto disabled:opacity-50"
              >
                <span className="text-2xl">{isSaved ? '🔖' : '📑'}</span>
              </button>
            </div>

            {/* Likes count */}
            {likesCount > 0 && <p className="font-semibold text-sm mb-2">{likesCount} {likesCount === 1 ? 'like' : 'likes'}</p>}

            {/* Caption */}
            {post.caption && (
              <div className="text-sm mb-2">
                <span className="font-semibold mr-2">{post.user.name || 'Anonymous'}</span>
                <span className="whitespace-pre-wrap">{post.caption}</span>
              </div>
            )}

            {/* Timestamp */}
            <p className="text-xs text-gray-400 uppercase mb-3">
              {new Date(post.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Comments Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="font-semibold text-lg mb-4">Comments</h2>

          {/* Add Comment Form */}
          <form onSubmit={handleAddComment} className="mb-6">
            <div className="flex items-start gap-3">
              <input
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Add a comment..."
                disabled={isAddingComment}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
              />
              <Button
                type="submit"
                variant="primary"
                disabled={!commentInput.trim() || isAddingComment}
              >
                {isAddingComment ? 'Posting...' : 'Post'}
              </Button>
            </div>
          </form>

          {/* Comments List */}
          {isLoadingComments ? (
            <div className="text-center py-8 text-gray-500">Loading comments...</div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-2">💬</div>
              <p className="text-gray-500">No comments yet</p>
              <p className="text-sm text-gray-400">Be the first to comment!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.commentId} className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0">
                  <button onClick={() => router.push(`/users/${comment.user.id}`)}>
                    <Avatar
                      src={comment.user.avatarUrl || undefined}
                      alt={comment.user.name || comment.user.email}
                      size="sm"
                    />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <button
                        onClick={() => router.push(`/users/${comment.user.id}`)}
                        className="font-semibold text-sm hover:opacity-70"
                      >
                        {comment.user.name || comment.user.email.split('@')[0]}
                      </button>
                      <p className="text-xs text-gray-400">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-sm mt-1 whitespace-pre-wrap">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
