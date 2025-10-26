// apps/web/app/explore/page.tsx
export default function ExplorePage() {
  // sonsuz scroll için placeholder alanı
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Explore</h1>
      <p className="text-muted-foreground">
        Akış (taze + etkileşim + benzerlik re-rank) – empty state
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-2xl border p-4 shadow-sm">Post #{i + 1} (skeleton)</div>
        ))}
      </div>
    </section>
  );
}
