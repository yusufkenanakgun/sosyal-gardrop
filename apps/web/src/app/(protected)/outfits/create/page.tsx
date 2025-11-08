'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { listItems, WardrobeItem } from '@/lib/api';
import { outfitsApi } from '@/lib/api/outfits';
import { TopBar } from '@/components/layout';
import { Card, Button } from '@/components/ui';

const WEATHER_OPTIONS = ['sunny', 'rainy', 'cold', 'hot'];
const OCCASION_OPTIONS = ['work', 'casual', 'sport', 'night', 'formal'];

export default function CreateOutfitPage() {
  const router = useRouter();
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<WardrobeItem[]>([]);
  const [weatherTag, setWeatherTag] = useState<string>('');
  const [occasionTag, setOccasionTag] = useState<string>('');
  const [creating, setCreating] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { items } = await listItems({ limit: 100 });
      setItems(items);
    } catch (error) {
      console.error('Failed to load items:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const toggleItem = (item: WardrobeItem) => {
    setSelectedItems((prev) => {
      const exists = prev.find((i) => i.id === item.id);
      if (exists) {
        return prev.filter((i) => i.id !== item.id);
      } else {
        return [...prev, item];
      }
    });
  };

  const handleCreate = async () => {
    if (selectedItems.length === 0) {
      alert('Please select at least one item');
      return;
    }

    setCreating(true);
    try {
      await outfitsApi.create({
        itemIds: selectedItems.map((i) => i.id),
        weatherTag: weatherTag || undefined,
        occasionTag: occasionTag || undefined,
      });
      router.push('/outfits');
    } catch (error) {
      console.error('Failed to create outfit:', error);
      alert('Failed to create outfit');
    } finally {
      setCreating(false);
    }
  };

  const itemTypes = Array.from(new Set(items.map((i) => i.type))).filter(Boolean);
  const filteredItems = filterType === 'all'
    ? items
    : items.filter((i) => i.type === filterType);

  return (
    <>
      <TopBar />

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Create Outfit</h1>
            <p className="text-sm text-gray-500">
              Select items from your wardrobe ({selectedItems.length} selected)
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={creating || selectedItems.length === 0}
            >
              {creating ? 'Creating...' : 'Create Outfit'}
            </Button>
          </div>
        </div>

        {/* Selected Items Preview */}
        {selectedItems.length > 0 && (
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3">Selected Items</h3>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {selectedItems.map((item) => (
                <div
                  key={item.id}
                  className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 border-purple-500 cursor-pointer"
                  onClick={() => toggleItem(item)}
                >
                  <Image
                    src={item.imageUrl}
                    alt={item.type ?? 'item'}
                    fill
                    sizes="80px"
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute top-0 right-0 bg-purple-500 text-white rounded-bl-lg p-1">
                    <span className="text-xs">✓</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Tags */}
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Weather (optional)
                </label>
                <div className="flex flex-wrap gap-2">
                  {WEATHER_OPTIONS.map((weather) => (
                    <button
                      key={weather}
                      onClick={() => setWeatherTag(weather === weatherTag ? '' : weather)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        weatherTag === weather
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {weather}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Occasion (optional)
                </label>
                <div className="flex flex-wrap gap-2">
                  {OCCASION_OPTIONS.map((occasion) => (
                    <button
                      key={occasion}
                      onClick={() => setOccasionTag(occasion === occasionTag ? '' : occasion)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        occasionTag === occasion
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {occasion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Filter by Type */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
              filterType === 'all'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {itemTypes.map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors capitalize ${
                filterType === type
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Items Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {filteredItems.map((item) => {
              const isSelected = selectedItems.some((i) => i.id === item.id);
              return (
                <Card
                  key={item.id}
                  hover
                  onClick={() => toggleItem(item)}
                  className={`cursor-pointer overflow-hidden p-0 relative ${
                    isSelected ? 'ring-2 ring-purple-500' : ''
                  }`}
                >
                  <div className="relative w-full aspect-square">
                    <Image
                      src={item.imageUrl}
                      alt={item.type ?? 'item'}
                      fill
                      sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 20vw"
                      className="object-cover"
                      unoptimized
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center">
                        <div className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center">
                          ✓
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-semibold truncate">
                      {item.brand || 'Unknown'}
                    </p>
                    <p className="text-xs text-gray-500 truncate capitalize">
                      {item.type}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">No items found</p>
            <Button onClick={() => router.push('/wardrobe')}>
              Go to Wardrobe
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
