'use client';
import React from 'react';
import { useWardrobeInfinite } from '../hooks';
import WardrobeCard from './WardrobeCard';
import type { WardrobeItem, ListItemsResponse } from '@/lib/api';
import type { InfiniteData } from '@tanstack/react-query';

export default function WardrobeGrid({ type }: { type?: string }) {
  const { data, fetchNextPage, hasNextPage, isLoading, isError, error } =
    useWardrobeInfinite({ type });

  const sentinelRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!hasNextPage || !sentinelRef.current) return;
    const el = sentinelRef.current;
    const io = new IntersectionObserver((entries) => {
      const [e] = entries;
      if (e.isIntersecting) fetchNextPage();
    });
    io.observe(el);
    return () => io.disconnect();
  }, [fetchNextPage, hasNextPage]);

  if (isLoading) return <p>Yükleniyor…</p>;
  if (isError) return <p className="text-red-600">Hata: {(error as Error).message}</p>;

  // data'yı güvenli biçimde daralt
  const pages: ListItemsResponse[] =
    ((data as InfiniteData<ListItemsResponse> | undefined)?.pages ?? []) as ListItemsResponse[];

  const items: WardrobeItem[] = pages.flatMap((p) => p.items);

  if (items.length === 0) return <p>Henüz öğe yok. Üstten yükleyebilirsin.</p>;

  return (
    <div className="mt-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {items.map((it) => (
          <WardrobeCard key={it.id} item={it} />
        ))}
      </div>
      <div ref={sentinelRef} className="h-8" />
      {!hasNextPage && (
        <p className="text-center text-sm text-gray-500 mt-4">Hepsi bu kadar 🎉</p>
      )}
    </div>
  );
}
