'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { outfitsApi, Outfit } from '@/lib/api/outfits';
import { TopBar, StoryBar } from '@/components/layout';
import { Card, Button, Modal } from '@/components/ui';

export default function OutfitsPage() {
  const router = useRouter();
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null);
  const [deleting, setDeleting] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await outfitsApi.getAll();
      setOutfits(data);
    } catch (error) {
      console.error('Failed to load outfits:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleDelete = async (outfitId: string) => {
    if (!confirm('Are you sure you want to delete this outfit?')) return;

    setDeleting(true);
    try {
      await outfitsApi.delete(outfitId);
      setSelectedOutfit(null);
      await refresh();
    } catch (error) {
      console.error('Failed to delete outfit:', error);
      alert('Failed to delete outfit');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <TopBar />

      <div className="max-w-6xl mx-auto">
        <StoryBar />

        <div className="px-4 py-6 space-y-6">
          {/* Header with Create Button */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">My Outfits</h1>
            <Button onClick={() => router.push('/outfits/create')}>
              + Create Outfit
            </Button>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Outfits Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {outfits.map((outfit) => (
                  <Card
                    key={outfit.id}
                    hover
                    onClick={() => setSelectedOutfit(outfit)}
                    className="cursor-pointer overflow-hidden p-0"
                  >
                    {/* Outfit Preview - Grid of Items */}
                    <div className="relative w-full aspect-square bg-gray-100">
                      <div className="grid grid-cols-2 gap-1 p-2 h-full">
                        {outfit.items.slice(0, 4).map((outfitItem) => (
                          <div
                            key={outfitItem.id}
                            className="relative rounded-lg overflow-hidden bg-white"
                          >
                            <Image
                              src={outfitItem.item.imageUrl}
                              alt={outfitItem.item.type}
                              fill
                              sizes="150px"
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        ))}
                      </div>
                      {outfit.items.length > 4 && (
                        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                          +{outfit.items.length - 4} more
                        </div>
                      )}
                    </div>

                    {/* Outfit Info */}
                    <div className="p-3">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {outfit.occasionTag && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                            {outfit.occasionTag}
                          </span>
                        )}
                        {outfit.weatherTag && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                            {outfit.weatherTag}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        {outfit.items.length} items • {new Date(outfit.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Empty State */}
              {outfits.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg mb-4">No outfits yet</p>
                  <Button onClick={() => router.push('/outfits/create')}>
                    Create your first outfit
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Outfit Detail Modal */}
      <Modal
        isOpen={!!selectedOutfit}
        onClose={() => setSelectedOutfit(null)}
        title="Outfit Details"
        size="lg"
      >
        {selectedOutfit && (
          <div className="space-y-6">
            {/* Outfit Items Grid */}
            <div className="grid grid-cols-2 gap-4">
              {selectedOutfit.items.map((outfitItem) => (
                <div key={outfitItem.id} className="space-y-2">
                  <div className="relative w-full aspect-square rounded-lg overflow-hidden border border-gray-200">
                    <Image
                      src={outfitItem.item.imageUrl}
                      alt={outfitItem.item.type}
                      fill
                      sizes="300px"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold capitalize">{outfitItem.slot}</p>
                    <p className="text-xs text-gray-500">
                      {outfitItem.item.brand || 'Unknown'} • {outfitItem.item.color || 'No color'}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Outfit Metadata */}
            <div className="p-4 bg-gray-50 rounded-xl space-y-2">
              {selectedOutfit.occasionTag && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Occasion:</span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                    {selectedOutfit.occasionTag}
                  </span>
                </div>
              )}
              {selectedOutfit.weatherTag && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Weather:</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    {selectedOutfit.weatherTag}
                  </span>
                </div>
              )}
              <div className="text-xs text-gray-500 pt-2 border-t">
                Created {new Date(selectedOutfit.createdAt).toLocaleString()}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => {
                  setSelectedOutfit(null);
                  router.push(`/posts/create?outfitId=${selectedOutfit.id}`);
                }}
              >
                Share Outfit
              </Button>
              <Button
                variant="danger"
                fullWidth
                onClick={() => handleDelete(selectedOutfit.id)}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
