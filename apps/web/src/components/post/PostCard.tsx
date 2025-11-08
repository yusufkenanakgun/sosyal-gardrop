'use client';

import Image from 'next/image';
import { Avatar, Modal } from '../ui';
import { MediaCarousel } from './MediaCarousel';
import { type Post, toggleLike, toggleSave, getPostLikes } from '@/lib/api/posts';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface PostCardProps {
  post: Post;
  onDelete?: (postId: string) => void;
  onLikeChange?: (postId: string, isLiked: boolean) => void;
  onSaveChange?: (postId: string, isSaved: boolean) => void;
}

interface LikeUser {
  userId: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  isFollowing: boolean;
  likedAt: string;
}

export function PostCard({ post, onDelete, onLikeChange, onSaveChange }: PostCardProps) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [isSaved, setIsSaved] = useState(post.isSaved || false);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [isLiking, setIsLiking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [likes, setLikes] = useState<LikeUser[]>([]);
  const [isLoadingLikes, setIsLoadingLikes] = useState(false);
  const [showOutfitDetail, setShowOutfitDetail] = useState(false);

  const handleUserClick = () => {
    router.push(`/users/${post.user.id}`);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this post?')) {
      onDelete?.(post.postId);
    }
    setShowMenu(false);
  };

  const handleLike = async () => {
    if (isLiking) return;

    try {
      setIsLiking(true);
      const newIsLiked = !isLiked;
      setIsLiked(newIsLiked);
      setLikesCount((prev) => (newIsLiked ? prev + 1 : prev - 1));

      const result = await toggleLike(post.postId);
      // Update based on server response
      setIsLiked(result.isLiked);
      onLikeChange?.(post.postId, result.isLiked);
    } catch (error) {
      console.error('Failed to toggle like:', error);
      // Revert on error
      setIsLiked(!isLiked);
      setLikesCount(post.likesCount);
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

      const result = await toggleSave(post.postId);
      setIsSaved(result.isSaved);
      onSaveChange?.(post.postId, result.isSaved);
    } catch (error) {
      console.error('Failed to toggle save:', error);
      setIsSaved(!isSaved);
    } finally {
      setIsSaving(false);
    }
  };

  const handleShowLikes = async () => {
    if (likesCount === 0) return;

    try {
      setIsLoadingLikes(true);
      setShowLikesModal(true);
      const data = await getPostLikes(post.postId);
      setLikes(data);
    } catch (error) {
      console.error('Failed to load likes:', error);
    } finally {
      setIsLoadingLikes(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg mb-4">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <button onClick={handleUserClick} className="flex items-center gap-3 hover:opacity-70">
          <Avatar src={post.user.avatarUrl || undefined} alt={post.user.name || post.user.email} size="sm" />
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

      {/* Outfit Display (if outfit exists) */}
      {post.outfit && post.outfit.items.length > 0 && (
        <div
          className="relative w-full aspect-square bg-gray-100 cursor-pointer"
          onClick={() => setShowOutfitDetail(true)}
        >
          <div className="grid grid-cols-2 gap-1 p-2 h-full">
            {post.outfit.items.slice(0, 4).map((outfitItem) => (
              <div
                key={outfitItem.id}
                className="relative rounded-lg overflow-hidden bg-white"
              >
                <Image
                  src={outfitItem.item.imageUrl}
                  alt={outfitItem.item.type}
                  fill
                  sizes="(max-width: 768px) 50vw, 300px"
                  className="object-cover"
                  unoptimized
                />
              </div>
            ))}
          </div>
          {post.outfit.items.length > 4 && (
            <div className="absolute bottom-3 right-3 bg-black/70 text-white text-sm px-3 py-1 rounded-full">
              +{post.outfit.items.length - 4} more
            </div>
          )}
          {/* Outfit Tags */}
          <div className="absolute top-3 left-3 flex gap-2">
            {post.outfit.occasionTag && (
              <span className="px-2 py-1 bg-purple-500 text-white text-xs rounded-full">
                {post.outfit.occasionTag}
              </span>
            )}
            {post.outfit.weatherTag && (
              <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                {post.outfit.weatherTag}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Media Carousel (for non-outfit posts) */}
      {!post.outfit && post.mediaUrls && post.mediaUrls.length > 0 && (
        <MediaCarousel images={post.mediaUrls} />
      )}

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
          <button
            onClick={() => router.push(`/posts/${post.postId}`)}
            className="hover:opacity-70 transition-opacity"
          >
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
        {likesCount > 0 && (
          <button
            onClick={handleShowLikes}
            className="font-semibold text-sm mb-2 hover:opacity-70"
          >
            {likesCount} {likesCount === 1 ? 'like' : 'likes'}
          </button>
        )}

        {/* Caption */}
        {post.caption && (
          <div className="text-sm mb-2">
            <span className="font-semibold mr-2">{post.user.name || 'Anonymous'}</span>
            <span className="whitespace-pre-wrap">{post.caption}</span>
          </div>
        )}

        {/* Comments count */}
        {post.commentsCount > 0 && (
          <button
            onClick={() => router.push(`/posts/${post.postId}`)}
            className="text-sm text-gray-500 mb-2 hover:opacity-70"
          >
            View all {post.commentsCount} {post.commentsCount === 1 ? 'comment' : 'comments'}
          </button>
        )}

        {/* Timestamp */}
        <p className="text-xs text-gray-400 uppercase mb-3">
          {new Date(post.createdAt).toLocaleString()}
        </p>
      </div>

      {/* Likes Modal */}
      <Modal
        isOpen={showLikesModal}
        onClose={() => setShowLikesModal(false)}
        title="Likes"
      >
        <div className="max-h-96 overflow-y-auto">
          {isLoadingLikes ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : likes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No likes yet</div>
          ) : (
            <div className="space-y-3">
              {likes.map((like) => (
                <div
                  key={like.userId}
                  className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg"
                >
                  <button
                    onClick={() => {
                      setShowLikesModal(false);
                      router.push(`/users/${like.userId}`);
                    }}
                    className="flex items-center gap-3 flex-1"
                  >
                    <Avatar
                      src={like.avatarUrl || undefined}
                      alt={like.name || like.email}
                      size="sm"
                    />
                    <div className="text-left">
                      <p className="font-semibold text-sm">
                        {like.name || like.email.split('@')[0]}
                      </p>
                      <p className="text-xs text-gray-500">{like.email}</p>
                    </div>
                  </button>
                  <p className="text-xs text-gray-400">
                    {new Date(like.likedAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Outfit Detail Modal */}
      {post.outfit && (
        <Modal
          isOpen={showOutfitDetail}
          onClose={() => setShowOutfitDetail(false)}
          title="Outfit Details"
          size="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {post.outfit.items.map((outfitItem) => (
                <div key={outfitItem.id} className="space-y-2">
                  <div className="relative w-full aspect-square rounded-lg overflow-hidden border border-gray-200">
                    <Image
                      src={outfitItem.item.imageUrl}
                      alt={outfitItem.item.type}
                      fill
                      sizes="300px"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold capitalize">{outfitItem.slot}</p>
                    <p className="text-xs text-gray-500">
                      {outfitItem.item.brand || 'Unknown'} • {outfitItem.item.color || 'No color'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {(post.outfit.occasionTag || post.outfit.weatherTag) && (
              <div className="p-4 bg-gray-50 rounded-xl space-y-2">
                {post.outfit.occasionTag && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Occasion:</span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                      {post.outfit.occasionTag}
                    </span>
                  </div>
                )}
                {post.outfit.weatherTag && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Weather:</span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      {post.outfit.weatherTag}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
