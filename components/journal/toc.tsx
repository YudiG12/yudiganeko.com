"use client";

import { useEffect, useRef, useState } from "react";
import type { TocItem } from "@/lib/journal/content";

function useActiveHeading(items: TocItem[]) {
  const [active, setActive] = useState<string | null>(items[0]?.id ?? null);
  useEffect(() => {
    if (!items.length) return;
    const els = items.map((i) => document.getElementById(i.id)).filter(Boolean) as HTMLElement[];
    const update = () => {
      const line = window.innerHeight * 0.3;
      let current = els[0]?.id ?? null;
      for (const el of els) if (el.getBoundingClientRect().top <= line) current = el.id;
      setActive(current);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [items]);
  return active;
}

function go(id: string, e: React.MouseEvent) {
  const el = document.getElementById(id);
  if (!el) return;
  e.preventDefault();
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  history.replaceState(null, "", `#${id}`);
}

/** Índice lateral (desktop) com indicador que desliza até a seção atual. */
export function TocSidebar({ items }: { items: TocItem[] }) {
  const active = useActiveHeading(items);
  const list = useRef<HTMLOListElement>(null);
  const [ind, setInd] = useState({ top: 0, height: 0 });
  useEffect(() => {
    const el = list.current?.querySelector<HTMLElement>(`[data-id="${active}"]`);
    if (el) setInd({ top: el.offsetTop, height: el.offsetHeight });
  }, [active]);
  if (items.length < 2) return null;
  return (
    <nav aria-label="Nesta página" className="sticky top-28 hidden max-h-[calc(100vh-9rem)] overflow-y-auto xl:block">
      <p className="mb-3 font-mono text-[11px] tracking-[0.08em] text-blue-fantastic/45">NESTA PÁGINA</p>
      <ol ref={list} className="relative flex flex-col border-l border-oatmeal/50">
        <span
          aria-hidden
          className="absolute -left-px w-[2px] rounded-full bg-truffle-trouble transition-[transform,height] duration-300 ease-[cubic-bezier(.34,1.56,.64,1)]"
          style={{ transform: `translateY(${ind.top}px)`, height: ind.height }}
        />
        {items.map((i) => (
          <li key={i.id} data-id={i.id}>
            <a
              href={`#${i.id}`}
              onClick={(e) => go(i.id, e)}
              className={`block py-1.5 pr-2 font-mono text-[12.5px] leading-[18px] transition-colors duration-200 ${
                i.level > 2 ? "pl-7" : "pl-4"
              } ${active === i.id ? "text-truffle-trouble" : "text-blue-fantastic/55 hover:text-blue-fantastic"}`}
            >
              {i.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Versão compacta (mobile/tablet): barra fixa com a seção atual que abre a lista. */
export function TocCompact({ items }: { items: TocItem[] }) {
  const active = useActiveHeading(items);
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 480);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  if (items.length < 2) return null;
  const current = items.find((i) => i.id === active) ?? items[0];
  return (
    <div
      className={`fixed inset-x-3 bottom-4 z-50 transition-all duration-300 ease-[cubic-bezier(.22,1,.36,1)] xl:hidden ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <div className="mx-auto max-w-md overflow-hidden rounded-2xl bg-white/95 shadow-[0_0_0_1px_rgba(201,193,177,0.7),0_20px_40px_-16px_rgba(44,59,77,0.4)] backdrop-blur">
        {open && (
          <ol className="gj-rise max-h-[50vh] overflow-y-auto border-b border-oatmeal/40 p-2">
            {items.map((i) => (
              <li key={i.id}>
                <a
                  href={`#${i.id}`}
                  onClick={(e) => {
                    go(i.id, e);
                    setOpen(false);
                  }}
                  className={`block rounded-lg py-2.5 pr-3 font-mono text-[13px] ${i.level > 2 ? "pl-7" : "pl-3"} ${
                    active === i.id ? "bg-palladian text-truffle-trouble" : "text-blue-fantastic/75"
                  }`}
                >
                  {i.text}
                </a>
              </li>
            ))}
          </ol>
        )}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-palladian"
        >
          <span className="font-mono text-[10px] tracking-[0.08em] text-blue-fantastic/45">SEÇÃO</span>
          <span className="min-w-0 flex-1 truncate font-mono text-[13px] text-blue-fantastic">{current.text}</span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#2C3B4D"
            strokeWidth="2"
            strokeLinecap="round"
            className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          >
            <path d="m6 15 6-6 6 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
