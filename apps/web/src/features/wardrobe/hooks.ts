'use client';
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type QueryFunctionContext,
} from '@tanstack/react-query';
import { listItems, presignUpload, completeUpload } from '@/lib/api';
import type { ListItemsResponse } from '@/lib/api';

type WardrobeKey = readonly ['wardrobe', 'list', { type?: string }];
type PageParam = string | null;

export function useWardrobeInfinite(filters: { type?: string }) {
  return useInfiniteQuery<
    ListItemsResponse,  // TQueryFnData
    Error,              // TError
    ListItemsResponse,  // TData
    WardrobeKey,        // TQueryKey
    PageParam           // TPageParam
  >({
    queryKey: ['wardrobe', 'list', filters] as const,
    initialPageParam: null,
    queryFn: ({ pageParam }: QueryFunctionContext<WardrobeKey, PageParam>) =>
      listItems({ limit: 24, cursor: pageParam ?? null, type: filters.type }),
    getNextPageParam: (last: ListItemsResponse) => last.nextCursor ?? undefined,
  });
}

export function usePresign() {
  return useMutation({ mutationFn: presignUpload });
}

/**
 * Upload sonrasında dosyayı kayıt altına almak için (api.files.complete)
 * createItem yerine completeUpload kullanıyoruz.
 */
export function useCompleteUpload() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (key: string) => completeUpload(key),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wardrobe', 'list'] });
    },
  });
}
