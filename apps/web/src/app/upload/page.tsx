'use client';

export const dynamic = 'force-dynamic'; // prerender error fix

import Link from 'next/link';
import UploadDropzone from '@/features/wardrobe/components/UploadDropzone';

export default function UploadPage() {
  return (
    <main className="min-h-dvh p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Sosyal Gardrop – Dosya Yükleme</h1>
          <Link
            href="/wardrobe"
            className="text-sm underline hover:opacity-80"
          >
            Wardrobe’a dön
          </Link>
        </div>

        <p className="text-sm text-gray-600">
          Bu sayfada dosyayı <strong>presigned PUT</strong> ile MinIO/S3’e yükleriz;
          ardından API’ye <strong>POST /wardrobe/items</strong> ile kaydederiz.
        </p>

        {/* Varsayılan accept image/pdf/video; overspec istersen accept prop’una geçebilirsin */}
        <UploadDropzone />

        <div className="rounded-xl border p-4 text-sm text-gray-600">
          <p className="font-medium mb-2">İpucu</p>
          <ul className="list-disc ml-5 space-y-1">
            <li>50 MB üstü dosyalarda onay isteyen uyarı çıkar.</li>
            <li>Yükleme tamamlanınca Wardrobe listesi invalidation ile yenilenir.</li>
            <li>PDF/Video için thumbnail yoksa kartta tür rozeti görünür.</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
