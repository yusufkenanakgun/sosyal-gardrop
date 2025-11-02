'use client';
import React from 'react';
import type { WardrobeItem } from '@/lib/api';

function fileNameFromKey(key?: string | null) {
  if (!key) return null;
  const parts = key.split('/');
  return parts[parts.length - 1] || null;
}

function badgeFromKey(key?: string | null) {
  if (!key) return 'FILE';
  const name = fileNameFromKey(key)?.toLowerCase() ?? '';
  if (name.endsWith('.pdf')) return 'PDF';
  if (name.endsWith('.mp4') || name.endsWith('.mov') || name.endsWith('.webm')) return 'VIDEO';
  return 'FILE';
}

export default function WardrobeCard({ item }: { item: WardrobeItem }) {
  const filename = fileNameFromKey(item.s3Key);
  const badge = !item.imageUrl ? badgeFromKey(item.s3Key) : null;

  return (
    <div className="rounded-2xl overflow-hidden border bg-white">
      <div className="aspect-square bg-gray-100 flex items-center justify-center">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={filename ?? item.type}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-xs font-semibold px-2 py-1 bg-gray-800 text-white rounded-md">
            {badge}
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="text-sm font-medium truncate">
          {filename ?? item.type}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {new Date(item.createdAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
