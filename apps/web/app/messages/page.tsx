// apps/web/app/messages/page.tsx
export default function MessagesPage() {
  return (
    <section className="grid gap-4 md:grid-cols-[280px_1fr]">
      <aside className="rounded-2xl border p-3 shadow-sm">
        <h2 className="mb-2 font-medium">Threads</h2>
        <ul className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <li key={i} className="rounded-xl border p-2">Thread #{i + 1}</li>
          ))}
        </ul>
      </aside>
      <div className="rounded-2xl border p-4 shadow-sm">
        <div className="mb-3 text-sm text-muted-foreground">Bir thread seçin.</div>
        <div className="flex items-center gap-2">
          <input className="w-full rounded-xl border px-3 py-2" placeholder="Mesaj yaz..." />
          <button className="rounded-xl border px-3 py-2 shadow-sm">Gönder</button>
        </div>
      </div>
    </section>
  );
}
