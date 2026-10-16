"use client";

import { useState, useTransition } from "react";
import { deleteComponentAction, duplicateComponentAction, listComponentsAction, saveComponentAction } from "@/app/admin/actions";
import { formatDate } from "@/lib/journal/content";
import type { InteractiveComponent } from "@/lib/journal/types";
import ComponentStudio from "../editor/component-studio";
import { ComponentThumb } from "../editor/library-picker";
import { Dialog, Toast } from "./ui";

type Draft = { id: string | null; name: string; html: string };

export default function ComponentLibrary({ initial }: { initial: InteractiveComponent[] }) {
  const [items, setItems] = useState(initial);
  const [q, setQ] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [confirm, setConfirm] = useState<InteractiveComponent | null>(null);
  const [toast, setToast] = useState<{ message: string; tone?: "ok" | "error"; key: number } | null>(null);
  const [pending, start] = useTransition();
  const say = (message: string, tone: "ok" | "error" = "ok") => setToast({ message, tone, key: Date.now() });
  const refresh = async () => {
    const r = await listComponentsAction();
    if (r.ok) setItems(r.data);
  };
  const list = items.filter((c) => c.name.toLowerCase().includes(q.toLowerCase().trim()));

  return (
    <main className="mx-auto w-full max-w-[960px] px-4 pb-24 pt-14">
      <div className="gj-rise flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-bold">Biblioteca</h1>
          <p className="text-sm text-blue-fantastic/65">
            {items.length} {items.length === 1 ? "componente interativo" : "componentes interativos"} para reutilizar nos artigos
          </p>
        </div>
        <label className="flex h-10 w-full items-center gap-2 rounded-[10px] px-3 ring-1 ring-oatmeal/90 focus-within:ring-blue-fantastic sm:w-[260px]">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(44,59,77,0.55)" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="buscar componente" className="flex-1 bg-transparent text-xs outline-none" />
        </label>
      </div>

      <ul className={`mt-8 grid gap-x-4 gap-y-6 sm:grid-cols-2 md:grid-cols-3 ${pending ? "opacity-60" : ""}`}>
        <li className="gj-rise">
          <button
            type="button"
            onClick={() => setDraft({ id: null, name: "", html: "" })}
            className="flex h-40 w-full flex-col items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-dashed border-truffle-trouble/40 text-truffle-trouble transition hover:bg-truffle-trouble/[0.03] active:scale-[0.99]"
          >
            <span className="text-xl">+</span>
            <span className="text-xs">Novo componente</span>
            <span className="text-[11px] text-blue-fantastic/50">cole um HTML</span>
          </button>
        </li>
        {list.map((c, i) => (
          <li key={c.id} className="gj-rise group" style={{ animationDelay: `${(i + 1) * 30}ms` }}>
            <div className="relative h-40 overflow-hidden rounded-[14px] bg-[#fcfbf8] ring-1 ring-oatmeal/70 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-[0_0_0_1.5px_#2c3b4d,0_14px_28px_-12px_rgba(44,59,77,0.35)]">
              <ComponentThumb html={c.html} />
              <div className="absolute inset-x-2.5 bottom-2.5 flex translate-y-2 gap-1.5 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
                <button
                  type="button"
                  onClick={() => setDraft({ id: c.id, name: c.name, html: c.html })}
                  className="flex h-8 flex-1 items-center justify-center rounded-[9px] bg-blue-fantastic text-xs font-semibold text-white active:scale-95"
                >
                  Editar
                </button>
                <button
                  type="button"
                  title="Duplicar"
                  onClick={() =>
                    start(async () => {
                      const r = await duplicateComponentAction(c.id);
                      if (!r.ok) return say(r.error, "error");
                      await refresh();
                      say("Componente duplicado");
                    })
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-white ring-1 ring-oatmeal/90 active:scale-95"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2C3B4D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="12" height="12" rx="2" />
                    <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
                  </svg>
                </button>
                <button
                  type="button"
                  title="Excluir"
                  onClick={() => setConfirm(c)}
                  className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-white ring-1 ring-oatmeal/90 active:scale-95"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#CF4238" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-0.5 px-0.5 pt-2.5">
              <span className="truncate text-[13px] font-semibold">{c.name}</span>
              <span className="text-[11px] text-blue-fantastic/55">
                criado em {formatDate(c.created_at, false)} · {c.usage ? `${c.usage} ${c.usage === 1 ? "artigo" : "artigos"}` : "não usado ainda"}
              </span>
            </div>
          </li>
        ))}
      </ul>

      <Dialog open={!!draft} onClose={() => setDraft(null)} width={1200} label="Editar componente">
        {draft && (
          <div className="overflow-hidden rounded-3xl">
            <ComponentStudio
              html={draft.html}
              onChange={(html) => setDraft((d) => (d ? { ...d, html } : d))}
              height={Math.max(380, (typeof window !== "undefined" ? window.innerHeight : 800) * 0.68)}
              headerLeft={
                <input
                  autoFocus={!draft.id}
                  value={draft.name}
                  onChange={(e) => setDraft((d) => (d ? { ...d, name: e.target.value.slice(0, 80) } : d))}
                  placeholder="Nome do componente"
                  className="min-w-0 flex-1 bg-transparent text-[13px] font-semibold outline-none placeholder:text-blue-fantastic/35"
                />
              }
              headerRight={
                <>
                  <button type="button" onClick={() => setDraft(null)} className="rounded-[9px] px-3 py-2 text-xs text-blue-fantastic/65 hover:bg-palladian">
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      start(async () => {
                        const r = await saveComponentAction(draft.id, draft.name, draft.html);
                        if (!r.ok) return say(r.error, "error");
                        await refresh();
                        setDraft(null);
                        say(draft.id ? "Componente atualizado" : "Salvo na biblioteca");
                      })
                    }
                    className="rounded-[9px] bg-blue-fantastic px-3 py-2 text-xs font-semibold text-white active:scale-95 disabled:opacity-50"
                  >
                    Salvar
                  </button>
                </>
              }
            />
          </div>
        )}
      </Dialog>

      <Dialog open={!!confirm} onClose={() => setConfirm(null)} width={420} label="Excluir componente">
        <div className="flex flex-col gap-4 p-6">
          <h2 className="text-base font-bold">Excluir “{confirm?.name}”?</h2>
          <p className="text-[13px] leading-5 text-blue-fantastic/70">
            Sai da biblioteca. Artigos que já usam esse componente continuam funcionando — cada artigo guarda a própria cópia.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setConfirm(null)} className="rounded-[10px] px-4 py-2.5 text-[13px] ring-1 ring-oatmeal/80">
              Cancelar
            </button>
            <button
              type="button"
              onClick={() =>
                start(async () => {
                  if (!confirm) return;
                  const r = await deleteComponentAction(confirm.id);
                  setConfirm(null);
                  if (!r.ok) return say(r.error, "error");
                  await refresh();
                  say("Componente excluído");
                })
              }
              className="rounded-[10px] bg-[#cf4238] px-4 py-2.5 text-[13px] font-semibold text-white active:scale-[0.98]"
            >
              Excluir
            </button>
          </div>
        </div>
      </Dialog>

      {toast && <Toast key={toast.key} message={toast.message} tone={toast.tone} onDone={() => setToast(null)} />}
    </main>
  );
}
