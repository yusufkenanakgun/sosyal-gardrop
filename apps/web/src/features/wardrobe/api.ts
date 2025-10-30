'use client';
import { api } from '@/lib/api';
import type { ListItemsResponse, WardrobeItem } from './types';

export async function presign(params: { filename: string; contentType: string }) {
  // lib/api.ts içindeki api.files.presign'i kullan
  return api.files.presign(params) as Promise<{
    uploadUrl: string;
    key: string;
    publicUrl: string;
  }>;
}

export async function createItem(params: {
  objectKey: string;
  contentType: string;
  publicUrl: string;
}) {
  // lib/api.ts içindeki api.wardrobe.createItem'i kullan
  return api.wardrobe.createItem(params) as Promise<WardrobeItem>;
}

export async function listItems(params: {
  limit?: number;
  cursor?: string | null;
  type?: string;
}) {
  // lib/api.ts içindeki api.wardrobe.listItems'i kullan
  return api.wardrobe.listItems(params) as Promise<ListItemsResponse>;
}
