import type { Metadata } from "next";
import Link from "next/link";
import { formatDate } from "@/lib/journal/content";
import { getCategories, searchArticles } from "@/lib/journal/queries";
import { articleUrl } from "@/lib/journal/site";

export const metadata: Metadata = {
  title: "Buscar artigos — Yudi Ganeko",
  robots: { index: false, follow: true },
};

type Props = { searchParams: Promise<{ q?: string }> };

export default async function SearchPage({ searchParams }: Props) {
  const q = ((await searchParams).q ?? "").trim();
  const [results, categories] = await Promise.all([q ? searchArticles(q, 30) : Promise.resolve([]), getCategories()]);
  const byId = new Map(categories.map((c) => [c.id, c.name]));
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[720px] flex-col px-4 pb-24 pt-28 font-mono tracking-wide sm:pt-32">
      <h1 className="text-center text-2xl font-bold text-blue-fantastic">Buscar</h1>
      <form action="/journal/busca" className="gj-rise mt-8 flex items-center gap-3 rounded-2xl px-4 ring-1 ring-oatmeal/80 focus-within:ring-[1.5px] focus-within:ring-blue-fantastic focus-within:shadow-[0_0_0_4px_rgba(44,59,77,0.06)]">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2C3B4D" strokeWidth="2" strokeLinecap="round" className="shrink-0 opacity-60">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          name="q"
          defaultValue={q}
          autoFocus
          placeholder="processos, memória, transistor…"
          className="h-14 flex-1 bg-transparent font-sans text-base text-blue-fantastic outline-none placeholder:text-blue-fantastic/35"
        />
        <button className="rounded-[10px] bg-blue-fantastic px-3.5 py-2 text-xs font-semibold text-white transition active:scale-95">
          Buscar
        </button>
      </form>
      {q && (
        <p className="mt-6 text-xs text-blue-fantastic/55">
          {results.length} {results.length === 1 ? "resultado" : "resultados"} para “{q}”
        </p>
      )}
      <ul className="mt-3 flex flex-col">
        {results.map((a, i) => (
          <li key={a.id} className="gj-rise border-b border-oatmeal/50" style={{ animationDelay: `${i * 30}ms` }}>
            <Link href={articleUrl(a.slug)} className="group -mx-3 flex flex-col gap-1 rounded-xl px-3 py-4 transition-colors hover:bg-palladian">
              <span className="font-sans text-[17px] font-semibold text-blue-fantastic transition-colors group-hover:text-truffle-trouble">
                {a.title}
              </span>
              {a.description && <span className="text-[13px] leading-5 text-blue-fantastic/70">{a.description}</span>}
              <span className="text-[11px] text-blue-fantastic/45">
                {[a.category_id ? byId.get(a.category_id) : null, formatDate(a.published_at), `${a.reading_minutes} min`]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {q && results.length === 0 && (
        <div className="mt-16 flex flex-col items-center gap-2 text-center">
          <span className="text-3xl text-oatmeal">∅</span>
          <p className="text-sm text-blue-fantastic/70">Nada encontrado. Tente outra palavra.</p>
        </div>
      )}
    </main>
  );
}
