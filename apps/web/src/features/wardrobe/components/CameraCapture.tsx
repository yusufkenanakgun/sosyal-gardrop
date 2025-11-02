// src/features/wardrobe/components/CameraCapture.tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { getErrorMessage } from "@/lib/error";

type Props = {
  onCapture: (file: File) => void;
  captureName?: string; // default: "photo.jpg"
};

export default function CameraCapture({ onCapture, captureName = "photo.jpg" }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setReady(true);
        }
      } catch (e: unknown) {
          setErr(getErrorMessage(e) || "Camera permission denied");
       }
    })();
    return () => stream?.getTracks().forEach((t) => t.stop());
  }, []);

  const handleShot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current;
    const c = canvasRef.current;
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(v, 0, 0, c.width, c.height);
    c.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], captureName, { type: "image/jpeg" });
      onCapture(file);
    }, "image/jpeg", 0.9);
  };

  return (
    <div className="flex flex-col gap-3">
      {err && <p className="text-sm text-red-500">{err}</p>}
      <video ref={videoRef} className="w-full rounded-xl shadow" playsInline muted />
      <canvas ref={canvasRef} className="hidden" />
      <button
        type="button"
        onClick={handleShot}
        disabled={!ready}
        className="px-4 py-2 rounded-xl bg-black text-white disabled:opacity-50"
      >
        Fotoğraf Çek
      </button>
    </div>
  );
}
