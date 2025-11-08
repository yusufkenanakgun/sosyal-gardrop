'use client';

import { fetchJSON } from './client';
import { WardrobeItem, ListItemsResponse, PresignResult } from './types';

export const files = {
  presign(params: { filename: string; contentType: string }) {
    return fetchJSON<PresignResult>(
      '/files/presign',
      { method: 'POST', body: JSON.stringify(params) }
    );
  },

  complete(params: { key: string }) {
    return fetchJSON<WardrobeItem>(
      '/files/complete',
      { method: 'POST', body: JSON.stringify(params) }
    );
  },

  list(params?: { limit?: number; cursor?: string | null; type?: string }) {
    const q = new URLSearchParams();
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.cursor) q.set('cursor', String(params.cursor));
    if (params?.type) q.set('type', params.type);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return fetchJSON<ListItemsResponse>(`/files/items${qs}`);
  },

  async downloadUrl(key: string) {
    const data = await fetchJSON<{ downloadUrl: string }>(
      `/files/download-url?key=${encodeURIComponent(key)}`
    );
    return data.downloadUrl;
  },
};

/**
 * Upload file helper with progress callback
 */
export async function uploadFile(
  file: File,
  folder: string = 'posts',
  onProgress?: (progress: number) => void
): Promise<string> {
  // Get presigned URL
  const { uploadUrl, key, publicUrl } = await files.presign({
    filename: `${folder}/${Date.now()}-${file.name}`,
    contentType: file.type,
  });

  // Upload to S3 with progress tracking
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const progress = (e.loaded / e.total) * 100;
        onProgress(progress);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(publicUrl || `http://localhost:9000/sg-public/${key}`);
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed'));
    });

    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  });
}

// Legacy exports for backward compatibility
export const presignUpload = files.presign;
export const completeUpload = (key: string) => files.complete({ key });
export const listItems = files.list;
