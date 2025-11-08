import { fetchJSON } from './client';

export interface UserSearchResult {
  userId: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  bio: string | null;
}

export interface UserProfile {
  userId: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  isOwnProfile: boolean;
}

export interface UpdateProfileData {
  name?: string;
  bio?: string;
}

export async function searchUsers(query: string): Promise<UserSearchResult[]> {
  return fetchJSON<UserSearchResult[]>(`/users/search?q=${encodeURIComponent(query)}`);
}

export async function getSuggestedUsers(): Promise<UserSearchResult[]> {
  return fetchJSON<UserSearchResult[]>('/users/suggested');
}

export async function getUserProfile(userId: string): Promise<UserProfile> {
  return fetchJSON<UserProfile>(`/users/${userId}`);
}

export async function getMyProfile(): Promise<UserProfile> {
  return fetchJSON<UserProfile>('/users/me');
}

export async function updateMyProfile(data: UpdateProfileData): Promise<UserSearchResult> {
  return fetchJSON<UserSearchResult>('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// Avatar upload functions
export async function requestAvatarPresignedUrl(
  filename: string,
  contentType: string,
): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
  return fetchJSON<{ uploadUrl: string; key: string; publicUrl: string }>(
    '/users/avatar/presign',
    {
      method: 'POST',
      body: JSON.stringify({ filename, contentType }),
    },
  );
}

export async function completeAvatarUpload(key: string): Promise<{ avatarUrl: string; message: string }> {
  return fetchJSON<{ avatarUrl: string; message: string }>('/users/avatar/complete', {
    method: 'POST',
    body: JSON.stringify({ key }),
  });
}

export async function uploadAvatar(file: File, onProgress?: (progress: number) => void): Promise<string> {
  // 1. Request presigned URL
  const { uploadUrl, key } = await requestAvatarPresignedUrl(file.name, file.type);

  // 2. Upload to S3
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl, true);
    xhr.setRequestHeader('Content-Type', file.type);

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          onProgress(progress);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status === 200) resolve();
      else reject(new Error(`Upload failed with status ${xhr.status}`));
    };

    xhr.onerror = () => reject(new Error('Upload failed'));
    xhr.send(file);
  });

  // 3. Complete upload
  const { avatarUrl } = await completeAvatarUpload(key);
  return avatarUrl;
}

// Follow system
export interface FollowUser {
  userId: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  bio: string | null;
  isFollowing: boolean;
  followedAt: string;
}

export async function followUser(userId: string): Promise<{ message: string }> {
  return fetchJSON<{ message: string }>(`/users/${userId}/follow`, {
    method: 'POST',
  });
}

export async function unfollowUser(userId: string): Promise<{ message: string }> {
  return fetchJSON<{ message: string }>(`/users/${userId}/follow`, {
    method: 'DELETE',
  });
}

export async function getFollowers(userId: string): Promise<FollowUser[]> {
  return fetchJSON<FollowUser[]>(`/users/${userId}/followers`);
}

export async function getFollowing(userId: string): Promise<FollowUser[]> {
  return fetchJSON<FollowUser[]>(`/users/${userId}/following`);
}
