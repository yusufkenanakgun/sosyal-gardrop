'use client';

import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { listItems, WardrobeItem } from '@/lib/api';
import { uploadViaPresign } from '@/lib/upload';
import { getErrorMessage } from '@/lib/error';

type Grouped = Record<string, WardrobeItem[]>;

export default function WardrobePage() {
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<WardrobeItem | null>(null);

  // Yükleme paneli durumu
  const [openUploader, setOpenUploader] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // file input tetiklemek için ref (querySelector yok)
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
      // Başarı → listeyi yeniden çek (veya başa ekle)
      await refresh();
      setOpenUploader(false);
      setSelected(created);
    } catch (e: unknown) {
        setError(getErrorMessage(e) || 'Upload failed');
    } finally {
      setUploading(false);
      // progress 100’e gelmediyse yine de sıfırla/sonlandır
      setTimeout(() => setProgress(0), 600);
    }
  }

  function onChooseFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) void handleUploadFile(f);
    // aynı dosyayı tekrar seçebilmek için reset
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
    <div className="h-full flex">
      {/* Sol: içerik */}
      <div className="flex-1 p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Gardrop</h1>

          {/* Yeni sayfaya gitmek yerine panel aç/kapa */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOpenUploader((v) => !v)}
              className="px-4 py-2 rounded-xl bg-black text-white"
            >
              {openUploader ? 'Yüklemeyi Kapat' : '+ Giysi ekle'}
            </button>
          </div>
        </div>

        {/* Yükleme Paneli (inline) */}
        {openUploader && (
          <div className="mb-6 rounded-xl border p-4">
            <p className="text-sm text-gray-700 mb-3">
              Dosyanı <strong>presigned PUT</strong> ile MinIO/S3’e yükleyeceğiz, ardından{' '}
              <strong>POST /files/complete</strong> ile kayıt yapılacak.
            </p>

            <div className="flex items-center gap-3">
              <label className="inline-flex items-center px-4 py-2 rounded-xl border cursor-pointer hover:bg-gray-50">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf,video/*"
                  onChange={onChooseFile}
                  disabled={uploading}
                  className="hidden"
                />
                <span>Dosya seç</span>
              </label>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-2 rounded-lg border"
                disabled={uploading}
              >
                Bilgisayardan Seç
              </button>

              {uploading && (
                <div className="flex-1 h-2 bg-gray-200 rounded overflow-hidden">
                  <div
                    className="h-full bg-black transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>

            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

            <ul className="mt-3 text-xs text-gray-600 list-disc ml-5 space-y-1">
              <li>50 MB üstü dosyalarda daha uzun sürebilir.</li>
              <li>Bucket private ise görsel görüntülerken süreli GET URL kullanılır.</li>
            </ul>
          </div>
        )}

        {loading ? (
          <p>Yükleniyor…</p>
        ) : (
          <div className="space-y-10">
            {Object.entries(grouped).map(([group, arr]) => (
              <section key={group}>
                <h2 className="text-lg font-medium mb-3 capitalize">{headerName(group)}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  {arr.map((it) => (
                    <button
                      key={it.id}
                      onClick={() => setSelected(it)}
                      className="group relative rounded-xl overflow-hidden border"
                    >
                      <div className="relative h-44 w-full">
                        <Image
                          src={it.imageUrl}
                          alt={it.type ?? 'wardrobe item'}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                          className="object-cover group-hover:scale-105 transition-transform"
                          unoptimized
                        />
                      </div>
                      <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-xs p-2">
                        {it.brand || '—'} • {it.color || '—'}
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {/* Sağ: detay paneli */}
      <aside
        className={`w-[380px] border-l bg-white transition-transform duration-200 ${
          selected ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-4 flex items-center justify-between">
          <h3 className="font-medium">Detay</h3>
          <button className="text-sm text-gray-500" onClick={() => setSelected(null)}>
            Kapat
          </button>
        </div>
        {selected ? (
          <div className="p-4 space-y-4">
            <div className="rounded-xl overflow-hidden border">
              <div className="relative w-full" style={{ aspectRatio: '3 / 4' }}>
                <Image
                  src={selected.imageUrl}
                  alt={selected.type ?? 'selected item'}
                  fill
                  sizes="380px"
                  className="object-cover"
                  unoptimized
                />
              </div>
            </div>
            <dl className="text-sm grid grid-cols-2 gap-y-2">
              <dt className="text-gray-500">Tür</dt>
              <dd className="font-medium capitalize">{selected.type}</dd>
              <dt className="text-gray-500">Marka</dt>
              <dd className="font-medium">{selected.brand || '—'}</dd>
              <dt className="text-gray-500">Renk</dt>
              <dd className="font-medium">{selected.color || '—'}</dd>
              <dt className="text-gray-500">Materyal</dt>
              <dd className="font-medium">{selected.material || '—'}</dd>
              <dt className="text-gray-500">Beden</dt>
              <dd className="font-medium">{selected.size || '—'}</dd>
              <dt className="text-gray-500">Sezon</dt>
              <dd className="font-medium">{selected.season || '—'}</dd>
              <dt className="text-gray-500">Etiketler</dt>
              <dd className="font-medium">
                {(selected.styleTags || []).join(', ') || '—'}
              </dd>
            </dl>
          </div>
        ) : (
          <div className="p-4 text-sm text-gray-500">Bir öğeye tıkla</div>
        )}
      </aside>
    </div>
  );
}
