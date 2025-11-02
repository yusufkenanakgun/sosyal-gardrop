// src/features/wardrobe/components/UploadOptions.tsx
"use client";
import { useCallback, useRef, useState } from "react";
import CameraCapture from "./CameraCapture";
import { presignUpload, completeUpload } from "@/lib/api";
import { putFileToPresignedUrl } from "@/lib/upload";
import { getErrorMessage } from "@/lib/error";

type Props = {
  onUploaded?: (itemId: string) => void; // başarılı insert sonrası
};

export default function UploadOptions({ onUploaded }: Props) {
  const [tab, setTab] = useState<"drop" | "file" | "camera">("drop");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFile = useCallback(async (file: File) => {
    try {
      setBusy(true);
      setMsg("Yükleme hazırlanıyor...");
      const ct = file.type || "application/octet-stream";
      const { uploadUrl, key } = await presignUpload({ filename: file.name, contentType: ct });

      setMsg("Yükleniyor...");
      await putFileToPresignedUrl(uploadUrl, file, ct);

      setMsg("Tamamlanıyor...");
      const item = await completeUpload(key);
      setMsg("Tamamlandı ✅");
      onUploaded?.(item.id);
    } catch (e: unknown) {
      setMsg(`Hata: ${getErrorMessage(e)}`);
    } finally {
      setBusy(false);
      setTimeout(() => setMsg(null), 2000);
    }
  }, [onUploaded]);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-4 flex gap-2">
        <button
          className={`px-3 py-2 rounded-xl ${tab === "drop" ? "bg-black text-white" : "bg-gray-100"}`}
          onClick={() => setTab("drop")}
        >
          Sürükle – Bırak
        </button>
        <button
          className={`px-3 py-2 rounded-xl ${tab === "file" ? "bg-black text-white" : "bg-gray-100"}`}
          onClick={() => setTab("file")}
        >
          Dosyadan Yükle
        </button>
        <button
          className={`px-3 py-2 rounded-xl ${tab === "camera" ? "bg-black text-white" : "bg-gray-100"}`}
          onClick={() => setTab("camera")}
        >
          Fotoğraf Çek
        </button>
      </div>

      {tab === "drop" && (
        <DropZone onFile={handleFile} disabled={busy} />
      )}

      {tab === "file" && (
        <div className="flex flex-col gap-3 items-start">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,application/pdf"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 rounded-xl bg-black text-white"
            disabled={busy}
          >
            Dosya Seç
          </button>
        </div>
      )}

      {tab === "camera" && (
        <CameraCapture onCapture={handleFile} />
      )}

      {!!msg && <p className="mt-4 text-sm text-gray-700">{msg}</p>}
    </div>
  );
}

function DropZone({ onFile, disabled }: { onFile: (f: File) => void; disabled?: boolean }) {
  const [hover, setHover] = useState(false);
  return (
    <label
      onDragOver={(e) => { e.preventDefault(); setHover(true); }}
      onDragLeave={() => setHover(false)}
      onDrop={(e) => {
        e.preventDefault();
        setHover(false);
        const f = e.dataTransfer.files?.[0];
        if (f) onFile(f);
      }}
      className={`w-full h-56 rounded-2xl border-2 border-dashed flex items-center justify-center cursor-pointer
        ${hover ? "bg-gray-50 border-black" : "border-gray-300"}
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <span className="text-gray-600">Dosyayı buraya sürükleyin veya tıklayın</span>
      <input
        type="file"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
        disabled={disabled}
      />
    </label>
  );
}
