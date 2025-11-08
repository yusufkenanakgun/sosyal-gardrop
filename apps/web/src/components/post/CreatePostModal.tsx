'use client';

import { Modal, Button, Avatar } from '../ui';
import { useState } from 'react';
import { createPost, PostVisibility } from '@/lib/api/posts';
import { uploadFile } from '@/lib/api/files';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  userAvatar?: string | null;
  userName?: string;
}

export function CreatePostModal({ isOpen, onClose, onSuccess, userAvatar, userName }: CreatePostModalProps) {
  const [caption, setCaption] = useState('');
  const [visibility, setVisibility] = useState<PostVisibility>(PostVisibility.PUBLIC);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploading(true);
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validate file type
        if (!file.type.startsWith('image/')) {
          alert('Only image files are allowed');
          continue;
        }

        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
          alert('Image must be less than 10MB');
          continue;
        }

        const url = await uploadFile(file, 'posts', (progress) => {
          setUploadProgress(Math.round(((i + progress / 100) / files.length) * 100));
        });

        uploadedUrls.push(url);
      }

      setMediaUrls((prev) => [...prev, ...uploadedUrls]);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload images');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveImage = (index: number) => {
    setMediaUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreatePost = async () => {
    if (!caption.trim() && mediaUrls.length === 0) {
      alert('Post must have caption or media');
      return;
    }

    try {
      setIsCreating(true);
      await createPost({
        caption: caption.trim() || undefined,
        mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
        visibility,
      });

      // Reset form
      setCaption('');
      setMediaUrls([]);
      setVisibility(PostVisibility.PUBLIC);

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to create post:', error);
      alert('Failed to create post');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create new post">
      <div className="space-y-4">
        {/* User info */}
        <div className="flex items-center gap-3">
          <Avatar src={userAvatar || undefined} alt={userName || 'User'} size="sm" />
          <p className="font-semibold">{userName || 'Anonymous'}</p>
        </div>

        {/* Caption */}
        <div>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="What's on your mind?"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            maxLength={2000}
          />
          <p className="text-xs text-gray-500 text-right mt-1">{caption.length}/2000</p>
        </div>

        {/* Media preview */}
        {mediaUrls.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {mediaUrls.map((url, index) => (
              <div key={index} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
                <button
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add media */}
        <div>
          <label
            htmlFor="post-media"
            className={`block w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-purple-500 transition-colors ${
              isUploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isUploading ? (
              <div>
                <p className="text-sm text-gray-600">Uploading... {uploadProgress}%</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600">📷 Add photos (max 10MB each)</p>
            )}
          </label>
          <input
            id="post-media"
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            disabled={isUploading}
            className="hidden"
          />
        </div>

        {/* Visibility */}
        <div>
          <label className="block text-sm font-medium mb-2">Visibility</label>
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as PostVisibility)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value={PostVisibility.PUBLIC}>Public</option>
            <option value={PostVisibility.FOLLOWERS}>Followers only</option>
            <option value={PostVisibility.PRIVATE}>Private</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={onClose} disabled={isCreating || isUploading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleCreatePost}
            disabled={isCreating || isUploading || (!caption.trim() && mediaUrls.length === 0)}
          >
            {isCreating ? 'Posting...' : 'Post'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
