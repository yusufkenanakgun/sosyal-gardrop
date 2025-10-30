// apps/web/src/features/wardrobe/types.ts
export type WardrobeItem = {
  id: string;
  userId: string;
  imageUrl: string | null;
  objectKey: string;
  contentType: string;
  createdAt: string;
  metadata?: Record<string, unknown> | null;
};

export type ListItemsResponse = {
  items: WardrobeItem[];
  nextCursor?: string | null;
};
