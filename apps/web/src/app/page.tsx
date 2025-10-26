export default function Page() {
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Sosyal Gardrop Web – Hello</h1>

      <div className="max-w-md rounded-2xl border p-6 shadow-sm">
        <p className="mb-4">
          Tailwind aktif. Bu kutu Tailwind utility sınıflarıyla stillendi.
        </p>
        <button className="rounded-lg px-4 py-2 text-white bg-violet-600 hover:bg-violet-700">
          Primary Button
        </button>
      </div>
    </main>
  );
}
