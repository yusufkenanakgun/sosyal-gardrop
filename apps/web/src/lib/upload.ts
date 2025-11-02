'use client';

import { api } from './api';

export type PresignResponse = {
  uploadUrl: string;
  key: string;
  publicUrl?: string | null;
  contentType?: string | null;
};

type PresignBody = {
  filename: string;
  contentType: string;
  prefix?: string;
};

function guessContentType(name: string, fallback = 'image/jpeg') {
  const n = name.toLowerCase();
  if (n.endsWith('.png')) return 'image/png';
  if (n.endsWith('.jpg') || n.endsWith('.jpeg')) return 'image/jpeg';
  if (n.endsWith('.webp')) return 'image/webp';
  if (n.endsWith('.gif')) return 'image/gif';
  if (n.endsWith('.svg')) return 'image/svg+xml';
  return fallback;
}

/** ---- Presign (AUTH → api.files.presign) ---- */
export async function getPresignedPutUrl(file: File, prefix?: string): Promise<PresignResponse> {
  const ct = file.type || guessContentType(file.name);
  const body: PresignBody = {
    filename: file.name,
    contentType: ct,
    ...(prefix ? { prefix } : {}),
  };
  return api.files.presign({ filename: body.filename, contentType: body.contentType });
}

/** ---- PUT (fetch) — progress gerekmezse ---- */
export async function putFileToPresignedUrl(
  uploadUrl: string,
  file: File,
  contentType?: string
): Promise<void> {
  const ct = contentType || file.type || guessContentType(file.name);
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': ct },
    body: file,
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(`Upload failed: ${res.status} ${msg || res.statusText}`);
  }
}

/** ---- PUT (XHR) — progress bar için ---- */
export function putToPresignedUrlXHR(opts: {
  file: File;
  uploadUrl: string;
  onProgress?: (pct: number) => void;
  signal?: AbortSignal;
}): Promise<void> {
  const { file, uploadUrl, onProgress, signal } = opts;
  const ct = file.type || guessContentType(file.name);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    const abortHandler = () => {
      xhr.abort();
      reject(new DOMException('Aborted', 'AbortError'));
    };

    if (signal) {
      if (signal.aborted) return abortHandler();
      signal.addEventListener('abort', abortHandler, { once: true });
    }

    xhr.upload.onprogress = (evt) => {
      if (!evt.lengthComputable) return;
      const pct = Math.round((evt.loaded / evt.total) * 100);
      onProgress?.(pct);
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
    };
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', ct);
    xhr.send(file);
  });
}

/** ---- Private bucket GET presign (AUTH) ---- */
export async function getSignedDownloadUrl(key: string): Promise<string> {
  return api.files.downloadUrl(key); // { downloadUrl } -> string
}

/** ---- Tek fonksiyonda: presign → PUT → complete ---- */
export async function uploadViaPresign(
  file: File,
  onProgress?: (pct: number) => void
) {
  const ct = file.type || guessContentType(file.name);

  const { uploadUrl, key } = await api.files.presign({
    filename: file.name,
    contentType: ct,
  });

  if (onProgress) {
    await putToPresignedUrlXHR({ file, uploadUrl, onProgress });
  } else {
    await putFileToPresignedUrl(uploadUrl, file, ct);
  }

  // API WardrobeItem döndürür (imageUrl null olabilir; s3Key kullanın)
  return api.files.complete({ key });
}
