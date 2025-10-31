'use client';

import Link from 'next/link';

export default function WardrobePage() {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Wardrobe</h1>
      <p>Dolabındaki parçalar – CRUD ve filtreler yakında eklenecek.</p>

      <Link
        href="/upload"
        className="inline-flex items-center px-4 py-2 rounded-xl border shadow hover:bg-gray-50 transition"
      >
        Dosya Yükle (Upload)
      </Link>
    </div>
  );
}
