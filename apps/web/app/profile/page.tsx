// apps/web/app/profile/page.tsx
export default function ProfilePage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Profile</h1>
      <div className="grid gap-4 md:grid-cols-[280px_1fr]">
        <div className="rounded-2xl border p-4 shadow-sm">
          <div className="h-24 w-24 rounded-full bg-gray-200" />
          <div className="mt-3 font-medium">Username</div>
          <div className="text-sm text-muted-foreground">Bio (empty)</div>
        </div>
        <div className="rounded-2xl border p-4 shadow-sm">
          <h2 className="mb-2 font-medium">Geçmiş kombinler</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl border p-3">
                <div className="aspect-square rounded-xl bg-gray-100" />
                <div className="mt-2 text-sm text-muted-foreground">Outfit #{i + 1}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
