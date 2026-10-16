"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { deleteArticleAction, deleteCategoryAction, saveCategoryAction, setStatusAction } from "@/app/admin/actions";
import { formatDate } from "@/lib/journal/content";
import { articleUrl } from "@/lib/journal/site";
import type { AdminArticleRow, Category } from "@/lib/journal/types";
import { Dialog, Toast, inputCls } from "./ui";

type Tab = "all" | "published" | "draft";

function relative(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "agora";
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)} h`;
  return formatDate(iso);
}

export default function ArticlesAdmin({ articles, categories }: { articles: AdminArticleRow[]; categories: Category[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("all");
  const [confirm, setConfirm] = useState<AdminArticleRow | null>(null);
  const [menu, setMenu] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; tone?: "ok" | "error" } | null>(null);
  const [catsOpen, setCatsOpen] = useState(false);
  const [pending, start] = useTransition();
  const counts = useMemo(
    () => ({
      all: articles.length,
      published: articles.filter((a) => a.status === "published").length,
      draft: articles.filter((a) => a.status === "draft").length,
    }),
    [articles],
  );
  const list = tab === "all" ? articles : articles.filter((a) => a.status === tab);
  const catName = new Map(categories.map((c) => [c.id, c.name]));

  const toggleStatus = (a: AdminArticleRow) =>
    start(async () => {
      const next = a.status === "published" ? "draft" : "published";
      const r = await setStatusAction(a.id, next, a.slug);
      setMenu(null);
      if (!r.ok) return setToast({ message: r.error, tone: "error" });
      setToast({ message: next === "published" ? "Publicado" : "Voltou para rascunho" });
      router.refresh();
    });

  return (
    <main className="mx-auto w-full max-w-[960px] px-4 pb-24 pt-14">
      <div className="gj-rise flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-bold">Artigos</h1>
          <p className="text-sm text-blue-fantastic/65">Compartilhando o que aprendi</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCatsOpen(true)}
            className="hidden h-10 items-center rounded-[10px] px-3.5 text-[13px] ring-1 ring-oatmeal/80 transition hover:bg-palladian active:scale-[0.98] sm:flex"
          >
            Categorias
          </button>
          <Link
            href="/admin/artigos/novo"
            className="flex h-10 items-center gap-2 rounded-[10px] bg-blue-fantastic px-4 text-[13px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_4px_10px_-4px_rgba(44,59,77,0.5)] transition hover:-translate-y-px active:scale-[0.98]"
          >
            <span className="text-base leading-none">+</span> Novo artigo
          </Link>
        </div>
      </div>

      <div className="mt-8 flex items-center gap-6 border-b border-oatmeal/50">
        {(
          [
            ["all", "Todos"],
            ["published", "Publicados"],
            ["draft", "Rascunhos"],
          ] as [Tab, string][]
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`relative flex gap-1.5 pb-3 text-[13px] transition-colors ${tab === k ? "text-blue-fantastic" : "text-blue-fantastic/60 hover:text-blue-fantastic"}`}
          >
            {label}
            <span className="text-blue-fantastic/40">{counts[k]}</span>
            <span
              className={`absolute inset-x-0 -bottom-px h-[1.5px] bg-blue-fantastic transition-transform duration-300 ease-[cubic-bezier(.34,1.56,.64,1)] ${
                tab === k ? "scale-x-100" : "scale-x-0"
              }`}
            />
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="gj-rise flex flex-col items-center gap-3 py-24 text-center">
          <span className="text-3xl text-oatmeal">∅</span>
          <p className="text-sm text-blue-fantastic/65">
            {tab === "draft" ? "Nenhum rascunho." : tab === "published" ? "Nada publicado ainda." : "Nenhum artigo ainda."}
          </p>
          <Link href="/admin/artigos/novo" className="text-[13px] text-truffle-trouble underline underline-offset-4">
            escrever o primeiro
          </Link>
        </div>
      ) : (
        <ul className={`flex flex-col transition-opacity ${pending ? "opacity-60" : ""}`}>
          {list.map((a, i) => (
            <li key={a.id} className={`gj-rise relative border-b border-oatmeal/50 ${menu === a.id ? "z-30" : "z-0"}`} style={{ animationDelay: `${i * 30}ms` }}>
              <Link href={`/admin/artigos/${a.id}`} className="group -mx-3 flex items-center gap-5 rounded-xl px-3 py-4 transition-colors hover:bg-palladian/70">
                <span className="relative block h-[63px] w-[112px] shrink-0 overflow-hidden rounded-[10px] bg-[#1f2733] ring-1 ring-oatmeal/60">
                  {a.cover_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.cover_url} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  )}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <span className="truncate text-sm font-semibold">{a.title || "Sem título"}</span>
                  <span className="line-clamp-1 text-xs text-blue-fantastic/60">
                    {a.description || (a.category_id ? catName.get(a.category_id) : "") || "sem descrição"}
                  </span>
                </span>
                <span className="hidden w-[110px] shrink-0 sm:flex">
                  <span
                    className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] ${
                      a.status === "published" ? "bg-[#2f8a5b]/10 text-[#2f8a5b]" : "bg-[#b87a12]/12 text-[#b87a12]"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${a.status === "published" ? "bg-[#2f8a5b]" : "bg-[#b87a12]"}`} />
                    {a.status === "published" ? "publicado" : "rascunho"}
                  </span>
                </span>
                <span className="hidden w-[104px] shrink-0 text-xs text-blue-fantastic/65 md:block">
                  {a.status === "published" ? formatDate(a.published_at) : relative(a.updated_at)}
                </span>
                <span className="hidden w-[60px] shrink-0 items-center gap-1.5 text-xs text-blue-fantastic/70 md:flex">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" />
                  </svg>
                  {a.status === "published" ? a.reactions : "—"}
                </span>
                <span className="w-8 shrink-0" />
              </Link>
              <button
                type="button"
                aria-label="Ações"
                onClick={() => setMenu(menu === a.id ? null : a.id)}
                className="absolute right-0 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg transition hover:bg-white hover:shadow-sm"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#2C3B4D">
                  <circle cx="5" cy="12" r="1.6" />
                  <circle cx="12" cy="12" r="1.6" />
                  <circle cx="19" cy="12" r="1.6" />
                </svg>
              </button>
              {menu === a.id && (
                <div className="gj-pop absolute right-0 top-[calc(50%+20px)] z-20 flex w-52 flex-col rounded-xl bg-white p-1.5 shadow-[0_0_0_1px_rgba(201,193,177,0.7),0_20px_40px_-12px_rgba(44,59,77,0.3)]">
                  <Link href={`/admin/artigos/${a.id}`} className="rounded-lg px-3 py-2 text-xs hover:bg-palladian">
                    Editar
                  </Link>
                  {a.status === "published" && (
                    <a href={articleUrl(a.slug)} target="_blank" className="rounded-lg px-3 py-2 text-xs hover:bg-palladian">
                      Ver no site ↗
                    </a>
                  )}
                  <button type="button" onClick={() => toggleStatus(a)} className="rounded-lg px-3 py-2 text-left text-xs hover:bg-palladian">
                    {a.status === "published" ? "Despublicar" : "Publicar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirm(a);
                      setMenu(null);
                    }}
                    className="rounded-lg px-3 py-2 text-left text-xs text-[#cf4238] hover:bg-[#cf4238]/[0.06]"
                  >
                    Excluir…
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <Dialog open={!!confirm} onClose={() => setConfirm(null)} width={420} label="Excluir artigo">
        <div className="flex flex-col gap-4 p-6">
          <h2 className="text-base font-bold">Excluir artigo?</h2>
          <p className="text-[13px] leading-5 text-blue-fantastic/70">
            “{confirm?.title || "Sem título"}” e as reações dele serão apagados para sempre. Isso não dá para desfazer.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setConfirm(null)} className="rounded-[10px] px-4 py-2.5 text-[13px] ring-1 ring-oatmeal/80">
              Cancelar
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  if (!confirm) return;
                  const r = await deleteArticleAction(confirm.id, confirm.slug);
                  setConfirm(null);
                  if (!r.ok) return setToast({ message: r.error, tone: "error" });
                  setToast({ message: "Artigo excluído" });
                  router.refresh();
                })
              }
              className="rounded-[10px] bg-[#cf4238] px-4 py-2.5 text-[13px] font-semibold text-white active:scale-[0.98]"
            >
              Excluir
            </button>
          </div>
        </div>
      </Dialog>

      <CategoriesDialog open={catsOpen} onClose={() => setCatsOpen(false)} categories={categories} onToast={setToast} />

      {toast && <Toast message={toast.message} tone={toast.tone} onDone={() => setToast(null)} />}
    </main>
  );
}

function CategoriesDialog({
  open,
  onClose,
  categories,
  onToast,
}: {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  onToast: (t: { message: string; tone?: "ok" | "error" }) => void;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();
  const save = (id: string | null, name: string, position: number) =>
    start(async () => {
      const r = await saveCategoryAction(id, name, position);
      if (!r.ok) return onToast({ message: r.error, tone: "error" });
      setDraft("");
      router.refresh();
    });
  return (
    <Dialog open={open} onClose={onClose} width={460} label="Categorias">
      <div className="flex flex-col gap-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold">Categorias</h2>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-palladian text-sm">
            ✕
          </button>
        </div>
        <ul className={`flex flex-col gap-1.5 ${pending ? "opacity-60" : ""}`}>
          {categories.map((c) => (
            <li key={c.id} className="flex items-center gap-2">
              <input
                value={editing[c.id] ?? c.name}
                onChange={(e) => setEditing((s) => ({ ...s, [c.id]: e.target.value }))}
                onBlur={() => editing[c.id] !== undefined && editing[c.id] !== c.name && save(c.id, editing[c.id], c.position)}
                className={`${inputCls} h-9 flex-1`}
              />
              <button
                type="button"
                onClick={() =>
                  start(async () => {
                    const r = await deleteCategoryAction(c.id);
                    if (!r.ok) return onToast({ message: r.error, tone: "error" });
                    router.refresh();
                  })
                }
                className="h-9 rounded-lg px-2.5 text-xs text-[#cf4238] hover:bg-[#cf4238]/[0.06]"
              >
                remover
              </button>
            </li>
          ))}
        </ul>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (draft.trim()) save(null, draft, categories.length + 1);
          }}
          className="flex gap-2"
        >
          <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="nova categoria" className={`${inputCls} h-9 flex-1`} />
          <button className="h-9 rounded-lg bg-blue-fantastic px-3.5 text-xs font-semibold text-white">Adicionar</button>
        </form>
        <p className="text-[11px] text-blue-fantastic/50">Remover uma categoria deixa os artigos dela sem categoria.</p>
      </div>
    </Dialog>
  );
}
