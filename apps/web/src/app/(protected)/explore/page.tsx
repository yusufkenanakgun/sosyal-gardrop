'use client';

import { TopBar } from '@/components/layout';
import { Card } from '@/components/ui';
import { useState } from 'react';

// Mock trending categories
const categories = [
  { id: '1', name: 'Streetwear', emoji: '🧥', count: '2.3M' },
  { id: '2', name: 'Minimalist', emoji: '👔', count: '1.8M' },
  { id: '3', name: 'Vintage', emoji: '👗', count: '1.5M' },
  { id: '4', name: 'Casual', emoji: '👕', count: '3.1M' },
  { id: '5', name: 'Formal', emoji: '🤵', count: '980K' },
  { id: '6', name: 'Athletic', emoji: '👟', count: '2.7M' },
];

// Mock explore grid
const exploreItems = Array.from({ length: 18 }, (_, i) => ({
  id: String(i + 1),
  type: ['outfit', 'item', 'collection'][i % 3],
  likes: Math.floor(Math.random() * 1000),
}));

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <>
      <TopBar />

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search styles, brands, or users..."
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Trending Categories */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Trending Categories</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <Card
                key={cat.id}
                hover
                className="p-4 text-center cursor-pointer"
              >
                <div className="text-4xl mb-2">{cat.emoji}</div>
                <p className="font-semibold text-sm mb-1">{cat.name}</p>
                <p className="text-xs text-gray-500">{cat.count} posts</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Explore Grid */}
        <div className="mb-4">
          <h2 className="text-xl font-bold mb-4">Explore</h2>
        </div>

        <div className="grid grid-cols-3 gap-1 sm:gap-4">
          {exploreItems.map((item) => (
            <Card
              key={item.id}
              hover
              className="relative overflow-hidden p-0 cursor-pointer"
            >
              <div className="relative w-full aspect-square bg-gradient-to-br from-purple-200 via-pink-200 to-blue-200 flex items-center justify-center">
                <span className="text-5xl">
                  {item.type === 'outfit' ? '👔' : item.type === 'item' ? '👕' : '🎨'}
                </span>
              </div>
              <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors"></div>
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-sm">
                <span className="flex items-center gap-1">
                  <span>❤️</span>
                  <span>{item.likes}</span>
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
