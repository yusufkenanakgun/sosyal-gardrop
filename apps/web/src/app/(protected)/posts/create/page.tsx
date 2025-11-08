'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { postsApi, PostVisibility } from '@/lib/api/posts';
import { outfitsApi, Outfit } from '@/lib/api/outfits';
import { TopBar } from '@/components/layout';
import { Card, Button } from '@/components/ui';

function CreatePostContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const outfitIdFromUrl = searchParams.get('outfitId');

  const [caption, setCaption] = useState('');
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingOutfits, setLoadingOutfits] = useState(false);

  useEffect(() => {
    const loadOutfits = async () => {
      setLoadingOutfits(true);
      try {
        const data = await outfitsApi.getAll();
        setOutfits(data);

        // If outfitId is in URL, select it
        if (outfitIdFromUrl) {
          const outfit = data.find((o) => o.id === outfitIdFromUrl);
          if (outfit) setSelectedOutfit(outfit);
        }
      } catch (error) {
        console.error('Failed to load outfits:', error);
      } finally {
        setLoadingOutfits(false);
      }
    };

    void loadOutfits();
  }, [outfitIdFromUrl]);

  const handleSubmit = async () => {
    if (!caption.trim() && !selectedOutfit) {
      alert('Please add a caption or select an outfit');
      return;
    }

    setLoading(true);
    try {
      await postsApi.create({
        caption: caption.trim() || undefined,
        outfitId: selectedOutfit?.id,
        visibility: PostVisibility.PUBLIC,
      });
      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to create post:', error);
      alert('Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <TopBar />

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Create Post</h1>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? 'Posting...' : 'Post'}
            </Button>
          </div>
        </div>

        {/* Caption Input */}
        <Card className="p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Caption
          </label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Write a caption..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            rows={4}
            maxLength={2000}
          />
          <div className="text-xs text-gray-500 mt-1 text-right">
            {caption.length}/2000
          </div>
        </Card>

        {/* Selected Outfit Preview */}
        {selectedOutfit && (
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Selected Outfit</h3>
              <button
                onClick={() => setSelectedOutfit(null)}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Remove
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {selectedOutfit.items.slice(0, 4).map((outfitItem) => (
                <div key={outfitItem.id} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                  <Image
                    src={outfitItem.item.imageUrl}
                    alt={outfitItem.item.type}
                    fill
                    sizes="200px"
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ))}
            </div>
            {selectedOutfit.items.length > 4 && (
              <p className="text-xs text-gray-500 mt-2">
                +{selectedOutfit.items.length - 4} more items
              </p>
            )}
          </Card>
        )}

        {/* Select Outfit Section */}
        {!selectedOutfit && (
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3">Select an Outfit (Optional)</h3>
            {loadingOutfits ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : outfits.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500 mb-3">You don't have any outfits yet</p>
                <Button
                  variant="secondary"
                  onClick={() => router.push('/outfits/create')}
                >
                  Create Outfit
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {outfits.map((outfit) => (
                  <button
                    key={outfit.id}
                    onClick={() => setSelectedOutfit(outfit)}
                    className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-purple-500 transition-colors"
                  >
                    <div className="grid grid-cols-2 gap-1 p-1 h-full bg-gray-100">
                      {outfit.items.slice(0, 4).map((outfitItem) => (
                        <div
                          key={outfitItem.id}
                          className="relative rounded overflow-hidden bg-white"
                        >
                          <Image
                            src={outfitItem.item.imageUrl}
                            alt={outfitItem.item.type}
                            fill
                            sizes="100px"
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      ))}
                    </div>
                    {outfit.items.length > 4 && (
                      <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                        +{outfit.items.length - 4}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Info */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Your post will be visible to all users</p>
          <p>• You can share an outfit to show your style combinations</p>
        </div>
      </div>
    </>
  );
}

export default function CreatePostPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <CreatePostContent />
    </Suspense>
  );
}
