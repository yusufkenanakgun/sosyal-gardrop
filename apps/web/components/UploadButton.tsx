'use client';

import * as React from 'react';
import { getPresignedPutUrl, getSignedDownloadUrl, putToPresignedUrlXHR } from '../src/lib/upload';

type Uploaded = {
  key: string;
  downloadUrl?: string;
  name: string;
  size: number;
  type: string;
};

type Props = {
  prefix?: string; // örn: "user-123"
  accept?: string; // "image/*" vb.
  maxSizeMB?: number; // istemci limiti
  multiple?: boolean;
};

export default function UploadButton({
  prefix = 'web-demo',
  accept = '*/*',
  maxSizeMB = 50,
  multiple = false,
}: Props) {
  const [progress, setProgress] = React.useState<number>(0);
  const [status, setStatus] = React.useState<string>('');
  const [uploaded, setUploaded] = React.useState<Uploaded[]>([]);
  const [isUploading, setIsUploading] = React.useState(false);
  const abortRef = React.useRef<AbortController | null>(null);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const list = Array.from(files);
    const maxBytes = maxSizeMB * 1024 * 1024;

    try {
      setIsUploading(true);
      for (const file of list) {
        if (file.size > maxBytes) {
          throw new Error(`"${file.name}" dosyası ${maxSizeMB}MB sınırını aşıyor.`);
        }

        setStatus(`Presign alınıyor: ${file.name}`);
        const presign = await getPresignedPutUrl(file, prefix);

        setStatus(`Yükleniyor: ${file.name}`);
        setProgress(0);
        const controller = new AbortController();
        abortRef.current = controller;

        await putToPresignedUrlXHR({
          file,
          uploadUrl: presign.uploadUrl,
          onProgress: (p: number) => setProgress(p),
          signal: controller.signal,
        });

        setStatus(`Doğrulanıyor: ${file.name}`);
        let dl: string | undefined;
        try {
          dl = await getSignedDownloadUrl(presign.key);
        } catch {
          dl = undefined;
        }

        setUploaded((prev) => [
          { key: presign.key, downloadUrl: dl, name: file.name, size: file.size, type: file.type },
          ...prev,
        ]);
      }
      setStatus('Tamam ✅');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Hata oluştu';
      setStatus(message);
    } finally {
      setIsUploading(false);
      setProgress(0);
      abortRef.current = null;
      e.target.value = ''; // aynı dosyayı yeniden seçebilmek için
    }
  };

  const onCancel = () => abortRef.current?.abort();

  return (
    <div className="w-full max-w-xl space-y-4">
      <div className="flex items-center gap-3">
        <label className="inline-flex items-center px-4 py-2 rounded-2xl shadow border cursor-pointer hover:opacity-90">
          <input type="file" className="hidden" onChange={onPick} accept={accept} multiple={multiple} />
          Dosya Seç
        </label>

        {isUploading ? (
          <button onClick={onCancel} className="px-3 py-2 rounded-2xl border shadow hover:bg-gray-50">
            İptal
          </button>
        ) : null}
      </div>

      {isUploading ? (
        <div className="w-full">
          <div className="mb-1 text-sm">{status}</div>
          <div className="h-3 w-full rounded-full bg-gray-200 overflow-hidden">
            <div className="h-3 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="text-xs mt-1">{progress}%</div>
        </div>
      ) : status ? (
        <div className="text-sm">{status}</div>
      ) : null}

      {uploaded.length > 0 && (
        <div className="space-y-2">
          <div className="font-medium">Yüklenenler</div>
          <ul className="space-y-2">
            {uploaded.map((u) => (
              <li key={u.key} className="p-3 rounded-xl border">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{u.name}</div>
                    <div className="text-xs text-gray-600 break-all">key: {u.key}</div>
                  </div>
                  {u.downloadUrl ? (
                    <a
                      href={u.downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1 rounded-lg border shadow hover:bg-gray-50 text-sm shrink-0"
                    >
                      İndir
                    </a>
                  ) : (
                    <button
                      className="px-3 py-1 rounded-lg border shadow text-sm opacity-60 cursor-not-allowed"
                      title="Anonim public URL kapalı (by design)"
                    >
                      Public Kapalı
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
