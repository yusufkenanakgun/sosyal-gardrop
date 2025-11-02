// src/features/wardrobe/components/UploadDropzone.tsx
'use client';
import React from 'react';
import { presignUpload, completeUpload } from '@/lib/api'; // (veya api.files.*)
import { putFileToPresignedUrl } from '@/lib/upload';
import { getErrorMessage } from '@/lib/error';

export default function UploadDropzone({ accept = 'image/*,application/pdf,video/*' }: { accept?: string }) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);

  const onPick = () => inputRef.current?.click();

  const handleFiles = async (files: FileList | File[] | null) => {
    setError(null);
    if (!files || (files instanceof FileList && files.length === 0)) return;
    const file = Array.from(files)[0];

    try {
      if (!file.type) throw new Error('Dosya türü algılanamadı');

      // accept kontrolü
      const accepted = accept.split(',').some((t) => {
        const trimmed = t.trim();
        if (trimmed.endsWith('/*')) return file.type.startsWith(trimmed.replace('/*', ''));
        return file.type === trimmed;
      });
      if (!accepted) throw new Error(`İzin verilmeyen içerik türü: ${file.type}`);

      if (file.size > 50 * 1024 * 1024) {
        const ok = confirm('Dosya 50MB üzeri. Yine de yüklemek istiyor musunuz?');
        if (!ok) return;
      }

      setUploading(true);
      setProgress(1);

      // 1) presign
      const pre = await presignUpload({ filename: file.name, contentType: file.type });

      // 2) PUT upload (progress)
      await putFileToPresignedUrl(pre.uploadUrl, file, file.type);
      setProgress(90);

      // 3) complete → DB kaydı
      await completeUpload(pre.key);
      setProgress(100);
    } catch (e: unknown) {
      setError(getErrorMessage(e) || 'Yükleme hatası');
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 800);
    }
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="w-full">
      <div
        onClick={onPick}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition ${
          dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
      >
        <p className="font-medium">Sürükle-bırak veya dosya seç</p>
        <p className="text-sm text-gray-500 mt-1">Desteklenen: görüntü / pdf / video</p>

        {progress > 0 && (
          <div className="mt-4">
            <div className="w-full h-2 bg-gray-200 rounded-full">
              <div className="h-2 rounded-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs mt-1">{progress}%</p>
          </div>
        )}

        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      </div>

      <div className="text-right mt-2">
        <button
          onClick={onPick}
          disabled={uploading}
          className="px-3 py-2 rounded-lg bg-gray-900 text-white text-sm disabled:opacity-50"
        >
          Dosya Seç
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
