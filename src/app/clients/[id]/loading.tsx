// src/app/clients/[id]/loading.tsx
export default function LoadingClientDetail() {
  return (
    <main className="space-y-10">
      <div className="animate-pulse space-y-2">
        <div className="h-4 w-28 rounded bg-ink-200/60" />
        <div className="h-8 w-64 rounded bg-ink-200/60" />
        <div className="h-4 w-40 rounded bg-ink-200/60" />
      </div>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border p-6">
          <div className="h-6 w-32 rounded bg-ink-200/60" />
          <div className="mt-4 space-y-3">
            <div className="h-9 w-full rounded bg-ink-200/50" />
            <div className="h-9 w-full rounded bg-ink-200/50" />
            <div className="grid gap-3 md:grid-cols-3">
              <div className="h-9 rounded bg-ink-200/50" />
              <div className="h-9 rounded bg-ink-200/50" />
              <div className="h-9 rounded bg-ink-200/50" />
            </div>
            <div className="h-9 w-32 rounded bg-ink-200/60" />
          </div>
        </div>

        <div className="rounded-2xl border p-6">
          <div className="h-6 w-24 rounded bg-ink-200/60" />
          <div className="mt-4 space-y-3">
            {[0, 1].map((i) => (
              <div key={i} className="rounded-lg border p-4">
                <div className="h-5 w-48 rounded bg-ink-200/60" />
                <div className="mt-2 h-2 w-full rounded bg-ink-200/50" />
                <div className="mt-3 flex gap-3">
                  <div className="h-9 w-40 rounded bg-ink-200/60" />
                  <div className="h-9 w-32 rounded bg-ink-200/60" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
