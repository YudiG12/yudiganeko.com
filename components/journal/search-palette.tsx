"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { articleUrl } from "@/lib/journal/site";

type Result = { slug: string; title: string; description: string; category: string | null; date: string; minutes: number };

function Highlight({ text, query }: { text: string; query: string }) {
  const words = query
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 1)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (!words.length) return <>{text}</>;
  const parts = text.split(new RegExp(`(${words.join("|")})`, "gi"));
  return (
    <>
      {parts.map((p, i) =>
        i % 2 ? (
          <mark key={i} className="rounded-[3px] bg-[#ffb162]/35 px-0.5 text-inherit">
            {p}
          </mark>
        ) : (
          p
        ),
      )}
    </>
  );
}

/** Busca estilo command palette (⌘K / Ctrl K / "/"). */
export default function SearchPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [sel, setSel] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  const close = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 120);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.closest("input, textarea, [contenteditable=true]");
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => input.current?.focus(), 10);
      document.documentElement.style.overflow = "hidden";
      return () => {
        document.documentElement.style.overflow = "";
      };
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const term = q.trim();
    if (term.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/journal/search?q=${encodeURIComponent(term)}`, { signal: ctrl.signal });
        const json = await res.json();
        setResults(json.results ?? []);
        setSel(0);
      } catch {
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 160);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q, open]);

  const goTo = (r: Result) => {
    close();
    router.push(articleUrl(r.slug));
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex h-9 items-center gap-2 rounded-full bg-white/90 px-3.5 text-blue-fantastic/70 ring-1 ring-oatmeal/70 backdrop-blur transition hover:text-blue-fantastic hover:ring-oatmeal active:scale-95"
        aria-label="Buscar artigos"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <span className="font-mono text-xs">buscar</span>
        <kbd className="hidden rounded-md bg-palladian px-1.5 py-0.5 font-mono text-[10px] text-blue-fantastic/60 sm:inline">⌘K</kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-[80] flex items-start justify-center px-3 pt-[12vh] sm:pt-[14vh]" role="dialog" aria-modal="true" aria-label="Buscar artigos">
          <button
            type="button"
            aria-label="Fechar busca"
            onClick={close}
            className={`absolute inset-0 bg-[rgba(15,22,30,0.32)] backdrop-blur-[6px] ${closing ? "opacity-0 transition-opacity duration-150" : "gj-fade"}`}
          />
          <div
            className={`relative flex w-full max-w-[640px] flex-col overflow-hidden rounded-[20px] bg-white shadow-[0_0_0_1px_rgba(201,193,177,0.6),0_40px_80px_-24px_rgba(15,22,30,0.45)] ${
              closing ? "scale-[0.97] opacity-0 transition-all duration-150" : "gj-pop"
            }`}
          >
            <div className="flex items-center gap-3 border-b border-oatmeal/50 px-5">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2C3B4D" strokeWidth="2" strokeLinecap="round" className="shrink-0 opacity-60">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                ref={input}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") close();
                  else if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setSel((s) => Math.min(results.length - 1, s + 1));
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setSel((s) => Math.max(0, s - 1));
                  } else if (e.key === "Enter" && results[sel]) goTo(results[sel]);
                }}
                placeholder="Buscar artigos…"
                className="h-[60px] flex-1 bg-transparent font-sans text-lg text-blue-fantastic outline-none placeholder:text-blue-fantastic/35"
                aria-label="Termo de busca"
              />
              {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-oatmeal border-t-truffle-trouble" />}
              <kbd className="rounded-md bg-palladian px-1.5 py-0.5 font-mono text-[10px] text-blue-fantastic/55">esc</kbd>
            </div>
            <div className="max-h-[56vh] overflow-y-auto p-2">
              {q.trim().length < 2 ? (
                <p className="px-3 py-8 text-center font-mono text-[13px] text-blue-fantastic/50">
                  Digite pelo menos 2 letras. Busca no título, na descrição e no texto.
                </p>
              ) : !loading && results.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-3 py-10 text-center">
                  <span className="font-mono text-2xl text-oatmeal">∅</span>
                  <p className="font-mono text-[13px] text-blue-fantastic/70">Nada encontrado para “{q.trim()}”.</p>
                  <p className="font-mono text-xs text-blue-fantastic/45">Tente outra palavra, tipo “memória” ou “processo”.</p>
                </div>
              ) : (
                <ul role="listbox" className="flex flex-col">
                  {results.map((r, i) => (
                    <li key={r.slug} role="option" aria-selected={i === sel}>
                      <button
                        type="button"
                        onMouseMove={() => setSel(i)}
                        onClick={() => goTo(r)}
                        className={`gj-rise flex w-full flex-col gap-1 rounded-xl px-3.5 py-3 text-left transition-colors duration-100 ${
                          i === sel ? "bg-palladian shadow-[inset_0_0_0_1px_rgba(201,193,177,0.6)]" : ""
                        }`}
                        style={{ animationDelay: `${i * 25}ms` }}
                      >
                        <span className="flex items-center gap-2">
                          <span className="min-w-0 flex-1 truncate font-sans text-[15px] font-semibold text-blue-fantastic">
                            <Highlight text={r.title} query={q} />
                          </span>
                          {i === sel && <span className="font-mono text-[11px] text-blue-fantastic/50">↵</span>}
                        </span>
                        {r.description && (
                          <span className="line-clamp-1 font-mono text-xs leading-5 text-blue-fantastic/65">
                            <Highlight text={r.description} query={q} />
                          </span>
                        )}
                        <span className="font-mono text-[11px] text-blue-fantastic/45">
                          {[r.category, r.date, `${r.minutes} min`].filter(Boolean).join(" · ")}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex items-center justify-between border-t border-oatmeal/40 px-4 py-2.5 font-mono text-[11px] text-blue-fantastic/45">
              <span>↑↓ navegar · ↵ abrir</span>
              <a href={`/journal/busca?q=${encodeURIComponent(q.trim())}`} className="text-truffle-trouble hover:underline">
                ver todos os resultados
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
