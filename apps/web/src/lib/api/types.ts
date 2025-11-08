'use client';

export type WardrobeItem = {
  id: string;
  userId?: string;
  type: string;
  brand?: string | null;
  color?: string | null;
  material?: string | null;
  size?: string | null;
  season?: string | null;
  styleTags?: string[] | null;
  imageUrl: string;
  s3Key?: string | null;
  createdAt: string;
};

export type ListItemsResponse = {
  items: WardrobeItem[];
  nextCursor?: string | null;
};

export type SessionPayload = {
  accessToken: string;
  refreshToken: string;
  userId: string;
};

export type PresignResult = {
  uploadUrl: string;
  key: string;
  publicUrl?: string | null;
  contentType: string;
};

export type User = {
  id: string;
  email: string;
  name?: string;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: User;
};
