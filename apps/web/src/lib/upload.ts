import { API_URL } from "./api";

export type PresignResponse = {
  uploadUrl: string;
  key: string;
  publicUrl?: string | null;
};

type PresignBody = {
  filename: string;
  contentType: string;
  prefix?: string;
};

/** Presigned PUT URL al */
export async function getPresignedPutUrl(file: File, prefix?: string): Promise<PresignResponse> {
  const body: PresignBody = {
    filename: file.name,
    contentType: file.type || "application/octet-stream",
    ...(prefix ? { prefix } : {}),
  };
  const res = await fetch(`${API_URL}/files/presign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" }, // şu anda auth yok
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`presign failed: ${res.status}`);
  return res.json();
}

/** Progress için XHR PUT */
export function putToPresignedUrlXHR(opts: {
  file: File;
  uploadUrl: string;
  onProgress?: (pct: number) => void;
  signal?: AbortSignal;
}): Promise<void> {
  const { file, uploadUrl, onProgress, signal } = opts;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    const abortHandler = () => {
      xhr.abort(); // XHR.abort() tipik olarak hata fırlatmaz
      reject(new DOMException("Aborted", "AbortError"));
    };

    if (signal) {
      if (signal.aborted) return abortHandler();
      signal.addEventListener("abort", abortHandler, { once: true });
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
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.send(file);
  });
}

/** İmzalı GET indirme linki */
export async function getSignedDownloadUrl(key: string): Promise<string> {
  const url = new URL(`${API_URL}/files/download-url`);
  url.searchParams.set("key", key);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`download-url failed: ${res.status}`);
  const data = await res.json();
  return data.downloadUrl || data.url || data.signedUrl;
}
