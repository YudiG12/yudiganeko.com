"use client";

import { useEffect, useState } from "react";
import { formatDate, slugify } from "@/lib/journal/content";
import type { Category } from "@/lib/journal/types";
import { Dialog, Toggle, inputCls } from "../admin/ui";
import { pickImage, uploadImage } from "./upload";

export type PublishFields = {
  title: string;
  description: string;
  slug: string;
  category_id: string | null;
  cover_url: string | null;
  seo_title: string;
  seo_description: string;
  featured: boolean;
  allow_reactions: boolean;
};

export default function PublishDialog({
  open,
  onClose,
  fields,
  onChange,
  categories,
  articleId,
  status,
  publishedAt,
  onPublish,
  onUnpublish,
  busy,
  onError,
}: {
  open: boolean;
  onClose: () => void;
  fields: PublishFields;
  onChange: (patch: Partial<PublishFields>) => void;
  categories: Category[];
  articleId: string | null;
  status: "draft" | "published";
  publishedAt: string | null;
  onPublish: () => void;
  onUnpublish: () => void;
  busy: boolean;
  onError: (m: string) => void;
}) {
  const [seoOpen, setSeoOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [slugDraft, setSlugDraft] = useState(fields.slug);
  useEffect(() => setSlugDraft(fields.slug), [fields.slug, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onPublish();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onPublish]);

  async function changeCover() {
    const file = await pickImage();
    if (!file) return;
    setUploading(true);
    try {
      onChange({ cover_url: await uploadImage(file, articleId) });
    } catch (e) {
      onError(e instanceof Error ? e.message : "Falha no upload");
    } finally {
      setUploading(false);
    }
  }

  const label = "font-mono text-xs font-semibold text-blue-fantastic";
  return (
    <Dialog open={open} onClose={onClose} label="Publicar artigo">
      <div className="flex items-start justify-between px-7 pt-7">
        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-xl font-bold text-blue-fantastic">{status === "published" ? "Atualizar artigo" : "Publicar artigo"}</span>
          <span className="font-mono text-[13px] text-blue-fantastic/65">É assim que ele vai aparecer na home.</span>
        </div>
        <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-palladian font-mono text-sm">
          ✕
        </button>
      </div>
      <div className="flex flex-col gap-7 px-7 pb-7 pt-6 md:flex-row">
        <div className="flex w-full shrink-0 flex-col gap-2.5 md:w-[300px]">
          <span className="font-mono text-[11px] tracking-[0.06em] text-blue-fantastic/55">PRÉVIA DO CARD</span>
          <button type="button" onClick={changeCover} className="group relative block aspect-video w-full overflow-hidden rounded-2xl bg-[#1f2733] text-left shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1)] ring-1 ring-oatmeal/60">
            {fields.cover_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={fields.cover_url} alt="" className={`absolute inset-0 h-full w-full object-cover transition-opacity ${uploading ? "opacity-40" : ""}`} />
            )}
            <span className="absolute inset-x-0 bottom-0 h-[84px] bg-[linear-gradient(to_top,rgba(24,32,44,0.95)_0%,rgba(24,32,44,0.75)_45%,rgba(24,32,44,0)_100%)]" />
            <span className="absolute inset-x-3.5 bottom-3 line-clamp-2 font-mono text-sm font-semibold leading-[19px] text-white">{fields.title || "Sem título"}</span>
            <span className="absolute right-2.5 top-2.5 flex items-center gap-1.5 rounded-full bg-white/[0.92] px-2.5 py-1.5 font-mono text-[11px] text-blue-fantastic transition-transform group-hover:scale-105">
              {uploading ? "enviando…" : fields.cover_url ? "↻ trocar" : "+ miniatura"}
            </span>
          </button>
          <span className="line-clamp-2 px-0.5 font-mono text-[13px] leading-5 text-blue-fantastic/75">{fields.description || "Sem descrição."}</span>
          <span className="px-0.5 font-mono text-xs text-blue-fantastic/60">{formatDate(publishedAt ?? new Date().toISOString())}</span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <label className="flex flex-col gap-2">
            <span className="flex justify-between">
              <span className={label}>Descrição curta</span>
              <span className={`font-mono text-xs ${fields.description.length > 160 ? "text-[#b87a12]" : "text-blue-fantastic/50"}`}>{fields.description.length}/160</span>
            </span>
            <textarea
              value={fields.description}
              onChange={(e) => onChange({ description: e.target.value.slice(0, 300) })}
              rows={2}
              className={`${inputCls} resize-none py-3 leading-5`}
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className={label}>Endereço</span>
            <span className={`${inputCls} flex h-[42px] items-center`}>
              <span className="shrink-0 text-blue-fantastic/50">/journal/artigos/</span>
              <input
                value={slugDraft}
                onChange={(e) => setSlugDraft(e.target.value)}
                onBlur={() => {
                  const s = slugify(slugDraft, 120);
                  if (s && s !== fields.slug) onChange({ slug: s });
                  else setSlugDraft(fields.slug);
                }}
                className="min-w-0 flex-1 bg-transparent outline-none"
              />
            </span>
          </label>
          <label className="flex flex-col gap-2">
            <span className={label}>Categoria</span>
            <select
              value={fields.category_id ?? ""}
              onChange={(e) => onChange({ category_id: e.target.value || null })}
              className={`${inputCls} h-[42px] cursor-pointer appearance-none bg-white`}
            >
              <option value="">Sem categoria</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-col rounded-xl ring-1 ring-oatmeal/70">
            <div className="flex items-center justify-between gap-3 border-b border-oatmeal/50 px-3.5 py-3">
              <span className="flex flex-col gap-0.5">
                <span className="font-mono text-[13px]">Reações</span>
                <span className="font-mono text-[11px] text-blue-fantastic/55">o leitor reage com emojis no fim</span>
              </span>
              <Toggle checked={fields.allow_reactions} onChange={(v) => onChange({ allow_reactions: v })} label="Reações" />
            </div>
            <div className="flex items-center justify-between gap-3 px-3.5 py-3">
              <span className="flex flex-col gap-0.5">
                <span className="font-mono text-[13px]">Mostrar na home</span>
                <span className="font-mono text-[11px] text-blue-fantastic/55">entra no carrossel de artigos</span>
              </span>
              <Toggle checked={fields.featured} onChange={(v) => onChange({ featured: v })} label="Mostrar na home" />
            </div>
          </div>
          <div className="flex flex-col">
            <button type="button" onClick={() => setSeoOpen((o) => !o)} className="flex items-center gap-2 self-start font-mono text-xs text-blue-fantastic/70 hover:text-blue-fantastic">
              <span className={`inline-block transition-transform ${seoOpen ? "rotate-90" : ""}`}>›</span> SEO e compartilhamento
            </button>
            {seoOpen && (
              <div className="gj-rise mt-3 flex flex-col gap-3">
                <input
                  value={fields.seo_title}
                  onChange={(e) => onChange({ seo_title: e.target.value.slice(0, 200) })}
                  placeholder={`Título no Google (padrão: ${fields.title || "título do artigo"})`}
                  className={`${inputCls} h-10`}
                />
                <textarea
                  value={fields.seo_description}
                  onChange={(e) => onChange({ seo_description: e.target.value.slice(0, 300) })}
                  placeholder="Descrição no Google (padrão: descrição curta)"
                  rows={2}
                  className={`${inputCls} resize-none py-2.5 leading-5`}
                />
                <span className="font-mono text-[11px] text-blue-fantastic/50">A miniatura também é a imagem de compartilhamento (Open Graph).</span>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 rounded-b-3xl border-t border-oatmeal/50 bg-[#fcfbf8] px-7 py-4">
        {status === "published" ? (
          <button type="button" onClick={onUnpublish} disabled={busy} className="font-mono text-xs text-[#cf4238] hover:underline disabled:opacity-50">
            despublicar
          </button>
        ) : (
          <span className="font-mono text-xs text-blue-fantastic/55">⌘ ↵ para publicar</span>
        )}
        <div className="flex gap-2.5">
          <button type="button" onClick={onClose} className="rounded-[10px] bg-white px-4 py-2.5 font-mono text-[13px] ring-1 ring-oatmeal/80 active:scale-[0.98]">
            Cancelar
          </button>
          <button
            type="button"
            onClick={onPublish}
            disabled={busy || !fields.title.trim()}
            className="relative min-w-[150px] rounded-[10px] bg-blue-fantastic px-4 py-2.5 font-mono text-[13px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_4px_10px_-4px_rgba(44,59,77,0.5)] transition active:scale-[0.98] disabled:opacity-50"
          >
            {busy ? (
              <span className="mx-auto block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : status === "published" ? (
              "Salvar e atualizar"
            ) : (
              "Publicar agora"
            )}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
