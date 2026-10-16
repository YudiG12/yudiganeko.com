"use client";

import { useMemo, useState } from "react";
import { formatDate } from "@/lib/journal/content";
import type { InteractiveComponent } from "@/lib/journal/types";
import { Dialog } from "../admin/ui";
import InteractiveFrame from "../interactive-frame";

/** Miniatura viva do componente (iframe em escala reduzida, sem interação). */
export function ComponentThumb({ html }: { html: string }) {
  return (
    <span className="pointer-events-none absolute inset-0 overflow-hidden">
      <span className="absolute left-0 top-0 block w-[250%] origin-top-left scale-[0.4]">
        <InteractiveFrame html={html} height={400} minHeight={400} />
      </span>
    </span>
  );
}

export default function LibraryPicker({
  open,
  onClose,
  components,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  components: InteractiveComponent[];
  onPick: (c: InteractiveComponent) => void;
}) {
  const [q, setQ] = useState("");
  const list = useMemo(() => components.filter((c) => c.name.toLowerCase().includes(q.toLowerCase().trim())), [components, q]);
  return (
    <Dialog open={open} onClose={onClose} width={940} label="Biblioteca de componentes">
      <div className="flex items-center gap-4 px-6 pb-4 pt-5">
        <div className="flex flex-1 flex-col gap-1">
          <span className="font-mono text-lg font-bold text-blue-fantastic">Biblioteca</span>
          <span className="font-mono text-xs text-blue-fantastic/60">
            {components.length} {components.length === 1 ? "componente interativo" : "componentes interativos"}
          </span>
        </div>
        <label className="hidden h-9 w-[260px] items-center gap-2 rounded-[10px] px-3 ring-1 ring-oatmeal/90 focus-within:ring-blue-fantastic sm:flex">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(44,59,77,0.55)" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="buscar componente" className="flex-1 bg-transparent font-mono text-xs outline-none" />
        </label>
        <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-palladian font-mono text-sm">
          ✕
        </button>
      </div>
      {list.length === 0 ? (
        <p className="px-6 pb-10 pt-6 text-center font-mono text-sm text-blue-fantastic/55">
          {components.length ? "Nenhum componente com esse nome." : "A biblioteca está vazia. Salve um bloco interativo nela para reutilizar depois."}
        </p>
      ) : (
        <ul className="grid gap-4 px-6 pb-6 sm:grid-cols-2 md:grid-cols-3">
          {list.map((c, i) => (
            <li key={c.id} className="gj-rise" style={{ animationDelay: `${i * 30}ms` }}>
              <button type="button" onClick={() => onPick(c)} className="group flex w-full flex-col gap-2.5 text-left">
                <span className="relative block h-40 w-full overflow-hidden rounded-[14px] bg-[#fcfbf8] ring-1 ring-oatmeal/70 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-[0_0_0_1.5px_#2c3b4d,0_14px_28px_-12px_rgba(44,59,77,0.35)]">
                  <ComponentThumb html={c.html} />
                  <span className="absolute inset-x-2.5 bottom-2.5 flex translate-y-2 items-center justify-center gap-1.5 rounded-[9px] bg-blue-fantastic py-2 font-mono text-xs font-semibold text-white opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
                    Inserir <span className="text-[10px] font-normal text-white/65">↵</span>
                  </span>
                </span>
                <span className="flex flex-col gap-0.5 px-0.5">
                  <span className="truncate font-mono text-[13px] font-semibold text-blue-fantastic">{c.name}</span>
                  <span className="font-mono text-[11px] text-blue-fantastic/55">
                    criado em {formatDate(c.created_at, false)}
                    {c.usage ? ` · ${c.usage} ${c.usage === 1 ? "artigo" : "artigos"}` : ""}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  );
}
