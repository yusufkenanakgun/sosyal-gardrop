'use client';

import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { listItems, WardrobeItem } from '@/lib/api';
import { uploadViaPresign } from '@/lib/upload';
import { getErrorMessage } from '@/lib/error';
import { TopBar, StoryBar } from '@/components/layout';
import { Card, Avatar, Button, Modal } from '@/components/ui';

type Grouped = Record<string, WardrobeItem[]>;

export default function WardrobePage() {
  const router = useRouter();
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<WardrobeItem | null>(null);

  // Yükleme paneli durumu
  const [openUploader, setOpenUploader] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // file input tetiklemek için ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { items } = await listItems({ limit: 100 });
    setItems(items);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const grouped: Grouped = useMemo(() => {
    const g: Grouped = {};
    for (const it of items) {
      const key = (it.type || 'others').toLowerCase();
      (g[key] ||= []).push(it);
    }
    return g;
  }, [items]);

  /** --- Yükleme Akışı: presign → PUT → complete --- */
  async function handleUploadFile(file: File) {
    setError(null);
    setUploading(true);
    setProgress(0);

    try {
      const created = await uploadViaPresign(file, (pct) => setProgress(pct));
      // Başarı → listeyi yeniden çek
      await refresh();
      setOpenUploader(false);
      setSelected(created);
    } catch (e: unknown) {
      setError(getErrorMessage(e) || 'Upload failed');
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 600);
    }
  }

  function onChooseFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) void handleUploadFile(f);
    e.currentTarget.value = '';
  }

  function headerName(key: string) {
    switch (key) {
      case 'jacket':
        return 'Ceketler';
      case 'sweatshirt':
        return 'Sweatler';
      case 'tshirt':
        return 'Tişörtler';
      case 'pants':
        return 'Pantolonlar';
      default:
        return key.charAt(0).toUpperCase() + key.slice(1);
    }
  }

  return (
    <>
      {/* Mobile Top Bar */}
      <TopBar />

      <div className="max-w-6xl mx-auto">
        {/* Story Bar */}
        <StoryBar />

        {/* Main Content */}
        <div className="px-4 py-6 space-y-6">
          {/* Header with Buttons */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Wardrobe</h1>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => router.push('/outfits')}>
                📦 My Outfits
              </Button>
              <Button onClick={() => setOpenUploader(true)}>
                + Add Item
              </Button>
            </div>
          </div>

          {/* Quick Actions */}
          {items.length >= 3 && (
            <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-purple-900">Ready to create an outfit?</p>
                  <p className="text-sm text-purple-700">You have {items.length} items in your wardrobe</p>
                </div>
                <Button onClick={() => router.push('/outfits/create')}>
                  ✨ Create Outfit
                </Button>
              </div>
            </Card>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(grouped).map(([group, arr]) => (
                <section key={group}>
                  <h2 className="text-xl font-semibold mb-4">{headerName(group)}</h2>
                  <div className="grid grid-cols-3 gap-1 sm:gap-4">
                    {arr.map((it) => (
                      <Card
                        key={it.id}
                        hover
                        onClick={() => setSelected(it)}
                        className="cursor-pointer overflow-hidden p-0"
                      >
                        <div className="relative w-full aspect-square">
                          <Image
                            src={it.imageUrl}
                            alt={it.type ?? 'wardrobe item'}
                            fill
                            sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 20vw"
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <div className="p-3">
                          <p className="text-sm font-semibold truncate">
                            {it.brand || 'Unknown Brand'}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {it.color || 'No color'} • {it.size || 'One size'}
                          </p>
                        </div>
                      </Card>
                    ))}
                  </div>
                </section>
              ))}

              {items.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg mb-4">Your wardrobe is empty</p>
                  <Button onClick={() => setOpenUploader(true)}>
                    Add your first item
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      <Modal
        isOpen={openUploader}
        onClose={() => setOpenUploader(false)}
        title="Upload New Item"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Upload your wardrobe item. The file will be uploaded using presigned PUT to MinIO/S3,
            then registered via POST /files/complete.
          </p>

          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-purple-500 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf,video/*"
              onChange={onChooseFile}
              disabled={uploading}
              className="hidden"
            />
            <div className="space-y-3">
              <div className="text-4xl">📸</div>
              <div>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  fullWidth
                >
                  {uploading ? 'Uploading...' : 'Choose File'}
                </Button>
              </div>
            </div>
          </div>

          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <ul className="text-xs text-gray-500 space-y-1">
            <li>• Files over 50 MB may take longer to upload</li>
            <li>• Private bucket files use presigned GET URLs for display</li>
          </ul>
        </div>
      </Modal>

      {/* Item Detail Modal */}
      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title="Item Details"
        size="lg"
      >
        {selected && (
          <div className="space-y-6">
            {/* Item Image */}
            <div className="rounded-xl overflow-hidden border border-gray-200">
              <div className="relative w-full aspect-square">
                <Image
                  src={selected.imageUrl}
                  alt={selected.type ?? 'selected item'}
                  fill
                  sizes="600px"
                  className="object-cover"
                  unoptimized
                />
              </div>
            </div>

            {/* Item Info - Instagram Style */}
            <div className="space-y-4">
              {/* Header with Avatar */}
              <div className="flex items-center gap-3">
                <Avatar alt="Your Wardrobe" size="md" />
                <div>
                  <p className="font-semibold">{selected.brand || 'Unknown Brand'}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(selected.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Type</p>
                  <p className="font-medium capitalize">{selected.type}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Brand</p>
                  <p className="font-medium">{selected.brand || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Color</p>
                  <p className="font-medium">{selected.color || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Material</p>
                  <p className="font-medium">{selected.material || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Size</p>
                  <p className="font-medium">{selected.size || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Season</p>
                  <p className="font-medium">{selected.season || '—'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-500 mb-1">Tags</p>
                  <p className="font-medium">
                    {(selected.styleTags || []).join(', ') || '—'}
                  </p>
                </div>
              </div>

              {/* Actions - Instagram Style */}
              <div className="flex items-center gap-4 pt-4 border-t">
                <button className="flex items-center gap-2 text-gray-600 hover:text-red-500 transition-colors">
                  <span className="text-2xl">❤️</span>
                  <span className="text-sm font-semibold">Like</span>
                </button>
                <button className="flex items-center gap-2 text-gray-600 hover:text-blue-500 transition-colors">
                  <span className="text-2xl">💬</span>
                  <span className="text-sm font-semibold">Comment</span>
                </button>
                <button className="flex items-center gap-2 text-gray-600 hover:text-purple-500 transition-colors ml-auto">
                  <span className="text-2xl">🔖</span>
                  <span className="text-sm font-semibold">Save</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
