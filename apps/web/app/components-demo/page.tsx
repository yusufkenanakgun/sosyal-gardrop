// apps/web/app/components-demo/page.tsx (opsiyonel)
import { Suspense } from "react";

export default function ComponentsDemo() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">UI Components</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border p-4 shadow-sm">
          <button className="rounded-xl border px-3 py-2 shadow-sm">Default Button</button>
        </div>
      </div>
      <Suspense fallback={<div>Loading…</div>}></Suspense>
    </section>
  );
}
