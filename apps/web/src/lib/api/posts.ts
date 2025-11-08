import { api } from '../api';

export interface Comment {
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

export interface CommentsResponse {
  comments: Comment[];
  nextCursor: string | null;
}

export interface LikeUser {
  userId: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  isFollowing: boolean;
  likedAt: string;
}

export enum PostVisibility {
  PUBLIC = 'public',
  FOLLOWERS = 'followers',
  PRIVATE = 'private',
}

export interface Post {
  postId: string;
  caption?: string;
  mediaUrls: string[];
  visibility: PostVisibility;
  user: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
  outfit?: {
    id: string;
    userId: string;
    weatherTag?: string;
    occasionTag?: string;
    createdAt: string;
    items: Array<{
      id: string;
      slot: string;
      item: {
        id: string;
        type: string;
        brand?: string;
        color?: string;
        imageUrl: string;
      };
    }>;
  } | null;
  likesCount: number;
  commentsCount: number;
  isOwnPost: boolean;
  isLiked?: boolean;
  isSaved?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FeedResponse {
  posts: Post[];
  nextCursor: string | null;
}

export interface UserPostsResponse {
  posts: Post[];
  nextCursor: string | null;
}

export interface CreatePostDto {
  caption?: string;
  mediaUrls?: string[];
  visibility?: PostVisibility;
  outfitId?: string;
}

export const postsApi = {
  create: (data: CreatePostDto) => api.post<Post>('/posts', data),
  getFeed: (cursor?: string, limit = 20) => {
    const params = new URLSearchParams();
    if (cursor) params.append('cursor', cursor);
    params.append('limit', String(limit));
    return api.get<FeedResponse>(`/posts/feed?${params.toString()}`);
  },
  getById: (postId: string) => api.get<Post>(`/posts/${postId}`),
  delete: (postId: string) => api.delete<void>(`/posts/${postId}`),
  getUserPosts: (userId: string, cursor?: string, limit = 20) => {
    const params = new URLSearchParams();
    if (cursor) params.append('cursor', cursor);
    params.append('limit', String(limit));
    return api.get<UserPostsResponse>(`/users/${userId}/posts?${params.toString()}`);
  },
  toggleLike: (postId: string) => api.post<{ isLiked: boolean }>(`/posts/${postId}/like`),
  toggleSave: (postId: string) => api.post<{ isSaved: boolean }>(`/posts/${postId}/save`),
  addComment: (postId: string, content: string) => api.post<Comment>(`/posts/${postId}/comments`, { content }),
  getComments: (postId: string, cursor?: string, limit = 50) => {
    const params = new URLSearchParams();
    if (cursor) params.append('cursor', cursor);
    params.append('limit', String(limit));
    return api.get<CommentsResponse>(`/posts/${postId}/comments?${params.toString()}`);
  },
  deleteComment: (commentId: string) => api.delete<void>(`/posts/comments/${commentId}`),
  getSavedPosts: (cursor?: string, limit = 20) => {
    const params = new URLSearchParams();
    if (cursor) params.append('cursor', cursor);
    params.append('limit', String(limit));
    return api.get<FeedResponse>(`/posts/saved?${params.toString()}`);
  },
};

/**
 * Create a new post
 */
export async function createPost(data: CreatePostDto): Promise<Post> {
  return api.post<Post>('/posts', data);
}

/**
 * Get feed for current user
 */
export async function getFeed(cursor?: string, limit = 20): Promise<FeedResponse> {
  const params = new URLSearchParams();
  if (cursor) params.append('cursor', cursor);
  params.append('limit', String(limit));

  return api.get<FeedResponse>(`/posts/feed?${params.toString()}`);
}

/**
 * Get post by ID
 */
export async function getPostById(postId: string): Promise<Post> {
  return api.get<Post>(`/posts/${postId}`);
}

/**
 * Delete post
 */
export async function deletePost(postId: string): Promise<void> {
  await api.delete<void>(`/posts/${postId}`);
}

/**
 * Get user posts
 */
export async function getUserPosts(userId: string, cursor?: string, limit = 20): Promise<UserPostsResponse> {
  const params = new URLSearchParams();
  if (cursor) params.append('cursor', cursor);
  params.append('limit', String(limit));

  return api.get<UserPostsResponse>(`/users/${userId}/posts?${params.toString()}`);
}

/**
 * Toggle like on post
 */
export async function toggleLike(postId: string): Promise<{ isLiked: boolean }> {
  return api.post<{ isLiked: boolean }>(`/posts/${postId}/like`);
}

/**
 * Get users who liked post
 */
export async function getPostLikes(postId: string): Promise<LikeUser[]> {
  return api.get<LikeUser[]>(`/posts/${postId}/likes`);
}

/**
 * Add comment to post
 */
export async function addComment(postId: string, content: string): Promise<Comment> {
  return api.post<Comment>(`/posts/${postId}/comments`, { content });
}

/**
 * Get comments for post
 */
export async function getPostComments(postId: string, cursor?: string, limit = 50): Promise<CommentsResponse> {
  const params = new URLSearchParams();
  if (cursor) params.append('cursor', cursor);
  params.append('limit', String(limit));

  return api.get<CommentsResponse>(`/posts/${postId}/comments?${params.toString()}`);
}

/**
 * Delete comment
 */
export async function deleteComment(commentId: string): Promise<void> {
  await api.delete<void>(`/posts/comments/${commentId}`);
}

/**
 * Toggle save post
 */
export async function toggleSave(postId: string): Promise<{ isSaved: boolean }> {
  return api.post<{ isSaved: boolean }>(`/posts/${postId}/save`);
}

/**
 * Get saved posts
 */
export async function getSavedPosts(cursor?: string, limit = 20): Promise<FeedResponse> {
  const params = new URLSearchParams();
  if (cursor) params.append('cursor', cursor);
  params.append('limit', String(limit));

  return api.get<FeedResponse>(`/posts/saved?${params.toString()}`);
}
