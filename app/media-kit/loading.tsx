// Shown by Next.js between the moment the user clicks a link to /media-kit
// and when the streaming page starts rendering. The page itself uses Suspense
// boundaries for per-section streaming — this just covers the navigation
// transition so clicks feel instant.

export default function Loading() {
  return (
    <main className="relative z-10 min-h-screen px-5 pb-24 md:px-10">
      <div className="mx-auto mt-6 flex max-w-[1180px] items-center justify-center gap-2.5 font-mono text-[10.5px] uppercase tracking-[0.24em] text-muted md:mt-8">
        <span aria-hidden className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-flame opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-flame" />
        </span>
        <span>media kit</span>
      </div>

      <article className="mx-auto mt-8 max-w-[1180px] space-y-20 md:mt-12 md:space-y-28">
        {/* Hero placeholder */}
        <section className="grid grid-cols-1 gap-6 md:grid-cols-12 md:gap-10">
          <div className="md:col-span-7">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 shrink-0 rounded-full border border-line bg-paper/40 md:h-[84px] md:w-[84px]" />
              <div>
                <div className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.28em] text-faint">
                  <span aria-hidden className="h-[1px] w-6 bg-line-strong" />
                  <span>media kit</span>
                </div>
                <div className="mt-1.5 h-3.5 w-40 rounded bg-paper/60" />
              </div>
            </div>
            <div className="mt-7 h-[150px] w-3/4 rounded bg-paper/40 md:h-[200px]" />
          </div>
          <aside className="md:col-span-5">
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[152px] rounded-2xl border border-line bg-paper/40"
                />
              ))}
            </div>
          </aside>
        </section>

        {/* Section placeholders */}
        {Array.from({ length: 4 }).map((_, i) => (
          <section key={i}>
            <div className="grid grid-cols-1 gap-4 border-t border-line pt-6 md:grid-cols-12 md:gap-8 md:pt-8">
              <div className="md:col-span-3">
                <div className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.28em] text-faint">
                  <span aria-hidden className="h-[1px] w-6 bg-line-strong" />
                  <span>0{i + 1}</span>
                </div>
                <div className="mt-3 h-7 w-3/4 rounded bg-paper/60 md:h-8" />
              </div>
              <div className="md:col-span-9">
                <div className="h-[240px] rounded-2xl border border-line bg-paper/40" />
              </div>
            </div>
          </section>
        ))}
      </article>
    </main>
  );
}
