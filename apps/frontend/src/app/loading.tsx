/** A shared fallback for route and server-component loading states. */
export default function Loading() {
  return (
    <main className="min-h-screen bg-background animate-pulse" aria-busy="true" aria-label="Loading page">
      <header className="h-16 border-b border-border/50 px-6 flex items-center justify-between">
        <div className="h-7 w-28 rounded-md bg-muted" />
        <div className="h-9 w-28 rounded-lg bg-muted" />
      </header>

      <section className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <div className="space-y-3">
          <div className="h-8 w-64 rounded-md bg-muted" />
          <div className="h-4 w-96 max-w-full rounded bg-muted/70" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-28 rounded-2xl border border-border/50 bg-card p-4 space-y-4">
              <div className="h-3 w-20 rounded bg-muted" />
              <div className="h-7 w-14 rounded bg-muted" />
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 rounded-2xl border border-border/50 bg-card p-6 space-y-5">
            <div className="h-5 w-40 rounded bg-muted" />
            <div className="h-48 rounded-xl bg-muted/60" />
          </div>
          <div className="h-72 rounded-2xl border border-border/50 bg-card p-6 space-y-4">
            <div className="h-5 w-32 rounded bg-muted" />
            <div className="h-4 w-full rounded bg-muted/70" />
            <div className="h-4 w-4/5 rounded bg-muted/70" />
            <div className="h-10 w-full rounded-lg bg-muted" />
          </div>
        </div>
      </section>
    </main>
  );
}
