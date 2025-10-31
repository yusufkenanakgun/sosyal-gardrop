'use client';
import React from 'react';
import type { WardrobeItem } from '../types';

export default function WardrobeCard({ item }: { item: WardrobeItem }) {
  const badge = !item.imageUrl
    ? item.contentType.startsWith('application/pdf')
      ? 'PDF'
      : item.contentType.startsWith('video/')
      ? 'VIDEO'
      : 'FILE'
    : null;

  return (
    <div className="rounded-2xl overflow-hidden border bg-white">
      <div className="aspect-square bg-gray-100 flex items-center justify-center">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={item.objectKey}
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
          {item.objectKey.split('/').slice(-1)[0]}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {new Date(item.createdAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
