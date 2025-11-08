import { api } from '../api';

export interface CreateOutfitDto {
  itemIds: string[];
  weatherTag?: string;
  occasionTag?: string;
}

export interface OutfitItem {
  id: string;
  outfitId: string;
  itemId: string;
  slot: string;
  createdAt: string;
  item: {
    id: string;
    userId: string;
    type: string;
    brand?: string;
    color?: string;
    material?: string;
    season: string[];
    styleTags: string[];
    size?: string;
    imageUrl: string;
    bgRemovedUrl?: string;
    labelsJSON?: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
  };
}

export interface Outfit {
  id: string;
  userId: string;
  score?: number;
  weatherTag?: string;
  occasionTag?: string;
  previewImageUrl?: string;
  createdAt: string;
  items: OutfitItem[];
}

export const outfitsApi = {
  create: async (data: CreateOutfitDto): Promise<Outfit> => {
    return api.post<Outfit>('/outfits', data);
  },

  getAll: async (): Promise<Outfit[]> => {
    return api.get<Outfit[]>('/outfits');
  },

  getOne: async (id: string): Promise<Outfit> => {
    return api.get<Outfit>(`/outfits/${id}`);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/outfits/${id}`);
  },
};
