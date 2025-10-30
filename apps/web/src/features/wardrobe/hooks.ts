'use client';
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type QueryFunctionContext,
} from '@tanstack/react-query';
import { createItem, listItems, presign } from './api';
import type { ListItemsResponse } from './types';

type WardrobeKey = readonly [ 'wardrobe', 'list', { type?: string } ];
type PageParam = string | null;

export function useWardrobeInfinite(filters: { type?: string }) {
  return useInfiniteQuery<
    ListItemsResponse,        // TQueryFnData
    Error,                    // TError
    ListItemsResponse,        // TData (seçim yapmadık, aynı kalsın)
    WardrobeKey,              // TQueryKey
    PageParam                 // TPageParam
  >({
    queryKey: ['wardrobe', 'list', filters] as const,
    initialPageParam: null,
    queryFn: ({ pageParam }: QueryFunctionContext<WardrobeKey, PageParam>) =>
      listItems({ limit: 24, cursor: pageParam ?? null, type: filters.type }),
    getNextPageParam: (last: ListItemsResponse) => last.nextCursor ?? undefined,
  });
}

export function usePresign() {
  return useMutation({ mutationFn: presign });
}

export function useCreateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createItem,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wardrobe', 'list'] });
    },
  });
}
