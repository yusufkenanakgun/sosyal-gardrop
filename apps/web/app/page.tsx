export default function Page() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Home</h1>
      <p className="text-muted-foreground">
        Hızlı eylemler: Öneri al, yeni parça yükle, son kombinler.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border p-4 shadow-sm">Son Yüklenenler (empty state)</div>
        <div className="rounded-2xl border p-4 shadow-sm">Önerilen Kombinler (empty state)</div>
        <div className="rounded-2xl border p-4 shadow-sm">İstatistikler (empty state)</div>
      </div>
    </section>
  );
}
