// apps/web/app/wardrobe/page.tsx
export default function WardrobePage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Wardrobe</h1>
      <div className="flex flex-wrap gap-2">
        <select className="rounded-lg border px-3 py-2">
          <option>Type</option><option>Top</option><option>Bottom</option>
        </select>
        <select className="rounded-lg border px-3 py-2">
          <option>Color</option><option>Black</option><option>White</option>
        </select>
        <select className="rounded-lg border px-3 py-2">
          <option>Season</option><option>Summer</option><option>Winter</option>
        </select>
        <button className="rounded-xl border px-3 py-2 shadow-sm">Upload</button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="rounded-2xl border p-3 shadow-sm">
            <div className="aspect-square rounded-xl bg-gray-100" />
            <div className="mt-2 text-sm text-muted-foreground">Item #{i + 1}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
