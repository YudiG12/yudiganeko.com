"use client";

import type { Editor } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createArticleAction, listComponentsAction, saveArticleAction, setStatusAction, type ArticlePatch } from "@/app/admin/actions";
import { countInteractive, docToText, emptyDoc, formatDate, slugify } from "@/lib/journal/content";
import { articleUrl } from "@/lib/journal/site";
import type { Article, Category, InteractiveComponent, JSONContent } from "@/lib/journal/types";
import { Segmented, Toast } from "../admin/ui";
import ArticleBody from "../article-body";
import { FormatToolbar, TableToolbar } from "./bubble-toolbar";
import { EditorContext, type EditorCtx } from "./context";
import { buildExtensions } from "./extensions";
import LibraryPicker from "./library-picker";
import PublishDialog, { type PublishFields } from "./publish-dialog";
import SlashMenu, { type SlashState } from "./slash-menu";
import { buildSlashItems, filterItems, type SlashItem } from "./slash-items";
import { pickImage, uploadImage } from "./upload";

type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

function AutoTextarea({ value, onChange, className, placeholder, onEnter }: { value: string; onChange: (v: string) => void; className: string; placeholder: string; onEnter?: () => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value.replace(/\n/g, ""))}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onEnter?.();
        }
      }}
      className={`w-full resize-none overflow-hidden bg-transparent outline-none ${className}`}
    />
  );
}

export default function ArticleEditor({
  article,
  categories,
  initialComponents,
}: {
  article: Article | null;
  categories: Category[];
  initialComponents: InteractiveComponent[];
}) {
  const [id, setId] = useState<string | null>(article?.id ?? null);
  const [status, setStatus] = useState<"draft" | "published">(article?.status ?? "draft");
  const [publishedAt, setPublishedAt] = useState<string | null>(article?.published_at ?? null);
  const [fields, setFields] = useState<PublishFields>({
    title: article?.title ?? "",
    description: article?.description ?? "",
    slug: article?.slug ?? "",
    category_id: article?.category_id ?? null,
    cover_url: article?.cover_url ?? null,
    seo_title: article?.seo_title ?? "",
    seo_description: article?.seo_description ?? "",
    featured: article?.featured ?? true,
    allow_reactions: article?.allow_reactions ?? true,
  });
  const [doc] = useState<JSONContent>(article?.content?.content?.length ? article.content : emptyDoc());
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [save, setSave] = useState<SaveState>("idle");
  const [savedAt, setSavedAt] = useState<string | null>(article?.updated_at ?? null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [toastMsg, setToastState] = useState<{ message: string; tone?: "ok" | "error"; key: number } | null>(null);
  const [components, setComponents] = useState(initialComponents);
  const [library, setLibrary] = useState<{ onPick: (c: InteractiveComponent) => void } | null>(null);
  const [slash, setSlash] = useState<SlashState & { from: number; to: number }>({ open: false, query: "", left: 0, top: 0, bottom: 0, from: 0, to: 0 });
  const [slashSel, setSlashSel] = useState(0);
  const [, force] = useState(0);

  const dirty = useRef(new Set<keyof ArticlePatch>());
  const fieldsRef = useRef(fields);
  fieldsRef.current = fields;
  const idRef = useRef(id);
  idRef.current = id;
  const saving = useRef(false);
  const again = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorRef = useRef<Editor | null>(null);
  // JSON puro (sem referências do ProseMirror) para atravessar a server action.
  const currentDoc = () => JSON.parse(JSON.stringify(editorRef.current?.getJSON() ?? emptyDoc())) as JSONContent;

  const toast = useCallback((message: string, tone: "ok" | "error" = "ok") => setToastState({ message, tone, key: Date.now() }), []);

  // ── Salvamento automático ──────────────────────────────────────────
  const flush = useCallback(async (): Promise<boolean> => {
    if (timer.current) clearTimeout(timer.current);
    if (saving.current) {
      again.current = true;
      return false;
    }
    if (dirty.current.size === 0) return true;
    const keys = [...dirty.current];
    const f = fieldsRef.current;
    const patch: ArticlePatch = {};
    for (const k of keys) {
      if (k === "content") patch.content = currentDoc();
      else (patch as Record<string, unknown>)[k] = f[k as keyof PublishFields];
    }
    const currentId = idRef.current;
    if (!currentId) {
      const d = currentDoc();
      const empty = !f.title.trim() && !docToText(d).trim() && !countInteractive(d);
      if (empty) return true;
    }
    dirty.current.clear();
    saving.current = true;
    setSave("saving");
    const r = currentId ? await saveArticleAction(currentId, patch) : await createArticleAction({ ...patch, title: f.title, content: currentDoc() });
    saving.current = false;
    if (!r.ok) {
      keys.forEach((k) => dirty.current.add(k));
      // Endereço já usado por outro artigo: ajusta com um sufixo curto e tenta de novo.
      if (r.error.startsWith("Já existe um artigo") && keys.includes("slug")) {
        const next = `${fieldsRef.current.slug.replace(/-[0-9a-z]{3}$/, "")}-${Math.random().toString(36).slice(2, 5)}`;
        setFields((x) => ({ ...x, slug: next }));
        fieldsRef.current = { ...fieldsRef.current, slug: next };
        toast(`Esse endereço já era usado. Ajustei para /${next}`);
        setSave("dirty");
        timer.current = setTimeout(() => void flush(), 300);
        return false;
      }
      setSave("error");
      toast(r.error, "error");
      return false;
    }
    const data = r.data as { id?: string; slug?: string; updated_at: string };
    if (!currentId && data.id) {
      const newId = data.id;
      setId(newId);
      idRef.current = newId;
      setFields((s) => ({ ...s, slug: data.slug ?? s.slug }));
      fieldsRef.current = { ...fieldsRef.current, slug: data.slug ?? fieldsRef.current.slug };
    }
    setSavedAt(data.updated_at);
    setSave(dirty.current.size ? "dirty" : "saved");
    if (again.current || dirty.current.size) {
      again.current = false;
      timer.current = setTimeout(() => void flush(), 400);
    }
    return true;
  }, [toast]);

  const markDirty = useCallback(
    (key: keyof ArticlePatch) => {
      dirty.current.add(key);
      setSave("dirty");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), 900);
    },
    [flush],
  );

  const changeFields = useCallback(
    (patch: Partial<PublishFields>) => {
      setFields((s) => ({ ...s, ...patch }));
      fieldsRef.current = { ...fieldsRef.current, ...patch };
      (Object.keys(patch) as (keyof PublishFields)[]).forEach((k) => markDirty(k));
    },
    [markDirty],
  );

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty.current.size || saving.current) {
        e.preventDefault();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "s" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        void flush();
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("keydown", onKey);
    };
  }, [flush]);

  // ── Imagens (menu, colar, arrastar) ─────────────────────────────────
  const insertImageFile = useCallback(
    async (file: File, pos?: number) => {
      const ed = editorRef.current;
      if (!ed) return;
      toast("Enviando imagem…");
      try {
        const src = await uploadImage(file, idRef.current);
        const node = { type: "image", attrs: { src, alt: "", caption: "", rounded: true, width: "column" } };
        if (typeof pos === "number") ed.chain().focus().insertContentAt(pos, node).run();
        else ed.chain().focus().insertContent(node).run();
        toast("Imagem adicionada");
      } catch (e) {
        toast(e instanceof Error ? e.message : "Falha no upload", "error");
      }
    },
    [toast],
  );

  const openLibrary = useCallback((onPick: (c: InteractiveComponent) => void) => setLibrary({ onPick }), []);
  const refreshComponents = useCallback(async () => {
    const r = await listComponentsAction();
    if (r.ok) setComponents(r.data);
  }, []);

  const items = useMemo(
    () =>
      buildSlashItems({
        components,
        onImage: async () => {
          const f = await pickImage();
          if (f) await insertImageFile(f);
        },
        onLibrary: (ed) =>
          openLibrary((c) => ed.chain().focus().insertContent({ type: "interactive", attrs: { html: c.html, name: c.name, componentId: c.id } }).run()),
      }),
    [components, insertImageFile, openLibrary],
  );
  const filtered = useMemo(() => filterItems(items, slash.query), [items, slash.query]);
  const slashRef = useRef({ slash, filtered, slashSel });
  slashRef.current = { slash, filtered, slashSel };

  const runItem = useCallback((item: SlashItem) => {
    const ed = editorRef.current;
    const s = slashRef.current.slash;
    if (!ed) return;
    setSlash((x) => ({ ...x, open: false }));
    item.run(ed, { from: s.from, to: s.to });
  }, []);

  const detectSlash = useCallback((ed: Editor) => {
    const { selection } = ed.state;
    const { $from, empty } = selection;
    const text = $from.parent.textContent;
    const ok =
      empty &&
      $from.parent.type.name === "paragraph" &&
      $from.depth === 1 &&
      text.startsWith("/") &&
      $from.parentOffset === text.length &&
      text.length <= 32 &&
      !/\s/.test(text.slice(1));
    if (!ok) {
      if (slashRef.current.slash.open) setSlash((x) => ({ ...x, open: false }));
      return;
    }
    const start = $from.start();
    const coords = ed.view.coordsAtPos(start);
    const query = text.slice(1);
    if (query !== slashRef.current.slash.query) setSlashSel(0);
    setSlash({ open: true, query, left: coords.left, top: coords.top, bottom: coords.bottom, from: start, to: $from.end() });
  }, []);

  // Extensões criadas uma vez só: se a referência mudar, o Tiptap recria o editor (e perde o texto).
  const extensions = useMemo(() => buildExtensions(), []);
  const editor = useEditor({
    immediatelyRender: false,
    extensions,
    content: doc,
    editorProps: {
      attributes: { class: "gj-editor-content", spellcheck: "true" },
      handleKeyDown: (_view, event) => {
        const { slash: s, filtered: f, slashSel: sel } = slashRef.current;
        if (!s.open) return false;
        if (event.key === "ArrowDown") {
          setSlashSel((i) => (f.length ? (i + 1) % f.length : 0));
          return true;
        }
        if (event.key === "ArrowUp") {
          setSlashSel((i) => (f.length ? (i - 1 + f.length) % f.length : 0));
          return true;
        }
        if (event.key === "Enter") {
          if (f[sel]) runItem(f[sel]);
          return true;
        }
        if (event.key === "Escape") {
          setSlash((x) => ({ ...x, open: false }));
          return true;
        }
        return false;
      },
      handlePaste: (view, event) => {
        const files = [...(event.clipboardData?.files ?? [])].filter((f) => f.type.startsWith("image/"));
        if (!files.length) return false;
        files.forEach((f) => void insertImageFile(f));
        return true;
      },
      handleDrop: (view, event) => {
        const files = [...(event.dataTransfer?.files ?? [])].filter((f) => f.type.startsWith("image/"));
        if (!files.length) return false;
        const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos;
        files.forEach((f) => void insertImageFile(f, pos));
        return true;
      },
    },
    onUpdate: ({ editor }) => {
      markDirty("content");
      detectSlash(editor as Editor);
    },
    onSelectionUpdate: ({ editor }) => {
      detectSlash(editor as Editor);
      force((n) => n + 1);
    },
  }, []);

  // Sempre a instância viva (em dev o StrictMode cria e destrói uma primeira instância).
  useEffect(() => {
    editorRef.current = (editor as Editor | null) ?? null;
  }, [editor]);

  // ── Publicação ─────────────────────────────────────────────────────
  async function publish() {
    setPublishing(true);
    if (dirty.current.size || saving.current) {
      while (saving.current) await new Promise((r) => setTimeout(r, 120));
      const ok = await flush();
      if (!ok) {
        setPublishing(false);
        return;
      }
    }
    const currentId = idRef.current;
    if (!currentId) {
      setPublishing(false);
      return toast("Escreva alguma coisa antes de publicar.", "error");
    }
    const r = await setStatusAction(currentId, "published", fieldsRef.current.slug);
    setPublishing(false);
    if (!r.ok) return toast(r.error === "title required" ? "Dê um título ao artigo antes de publicar." : r.error, "error");
    const wasPublished = status === "published";
    setStatus("published");
    setPublishedAt(r.data.published_at);
    setPublishOpen(false);
    toast(wasPublished ? "Atualizado no site" : "Publicado! Já está no ar.");
  }

  async function unpublish() {
    if (!idRef.current) return;
    setPublishing(true);
    const r = await setStatusAction(idRef.current, "draft", fieldsRef.current.slug);
    setPublishing(false);
    if (!r.ok) return toast(r.error, "error");
    setStatus("draft");
    setPublishOpen(false);
    toast("Voltou para rascunho");
  }

  const ctx: EditorCtx = useMemo(
    () => ({ articleId: id, components, refreshComponents, toast, openLibrary }),
    [id, components, refreshComponents, toast, openLibrary],
  );

  const category = categories.find((c) => c.id === fields.category_id);
  const previewDoc = mode === "preview" ? ((editor?.getJSON() as JSONContent) ?? doc) : doc;

  const saveLabel =
    save === "saving" ? "salvando…" : save === "error" ? "erro ao salvar" : save === "dirty" ? "alterações não salvas" : savedAt ? `salvo ${formatDate(savedAt, false) === formatDate(new Date().toISOString(), false) ? "" : formatDate(savedAt, false)}`.trim() : "rascunho novo";

  return (
    <EditorContext.Provider value={ctx}>
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-oatmeal/50 bg-white/85 px-4 backdrop-blur-md sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Link href="/admin/artigos" className="shrink-0 transition-opacity hover:opacity-80" onClick={() => void flush()}>
            <Image src="/logo.png" alt="Yudi Ganeko" width={871} height={286} className="h-[26px] w-auto" />
          </Link>
          <span className="hidden text-sm text-oatmeal sm:inline">/</span>
          <Link href="/admin/artigos" onClick={() => void flush()} className="hidden text-[13px] text-blue-fantastic/65 hover:text-blue-fantastic sm:inline">
            artigos
          </Link>
          <span className="hidden text-sm text-oatmeal md:inline">/</span>
          <span className="hidden min-w-0 truncate text-[13px] md:inline">{fields.slug || "novo"}</span>
          <span
            className={`shrink-0 rounded-full px-2 py-1 text-[11px] tracking-[0.04em] ${
              status === "published" ? "bg-[#2f8a5b]/10 text-[#2f8a5b]" : "bg-truffle-trouble/[0.08] text-truffle-trouble"
            }`}
          >
            {status === "published" ? "publicado" : "rascunho"}
          </span>
        </div>
        <Segmented
          value={mode}
          onChange={(m) => {
            setMode(m);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          options={[
            { value: "edit", label: "Editar" },
            { value: "preview", label: "Visualizar" },
          ]}
          size="md"
        />
        <div className="flex flex-1 items-center justify-end gap-2.5">
          <span className="hidden items-center gap-2 text-xs text-blue-fantastic/60 md:flex" aria-live="polite">
            <span
              className={`h-1.5 w-1.5 rounded-full transition-colors ${
                save === "error" ? "bg-[#cf4238]" : save === "saving" ? "bg-[#b87a12] animate-pulse" : save === "dirty" ? "bg-oatmeal" : "bg-[#2f8a5b] shadow-[0_0_0_3px_rgba(47,138,91,0.15)]"
              }`}
            />
            {save === "error" ? (
              <button type="button" onClick={() => void flush()} className="text-[#cf4238] underline underline-offset-2">
                erro ao salvar · tentar de novo
              </button>
            ) : (
              saveLabel
            )}
          </span>
          {status === "published" && (
            <a href={articleUrl(fields.slug)} target="_blank" className="hidden text-xs text-blue-fantastic/60 hover:text-blue-fantastic lg:inline">
              ver ↗
            </a>
          )}
          <button
            type="button"
            onClick={async () => {
              // Rascunho ainda com endereço automático: sugere um a partir do título.
              const f = fieldsRef.current;
              if (status === "draft" && /^rascunho-[0-9a-f]{6}$/.test(f.slug) && f.title.trim()) {
                const s = slugify(f.title, 120);
                if (s) changeFields({ slug: s });
              }
              await flush();
              setPublishOpen(true);
            }}
            className="rounded-[10px] bg-blue-fantastic px-4 py-2.5 text-[13px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_4px_10px_-4px_rgba(44,59,77,0.5)] transition hover:-translate-y-px active:scale-[0.97]"
          >
            {status === "published" ? "Atualizar" : "Publicar"}
          </button>
        </div>
      </header>

      <main className="overflow-x-clip px-4">
        <div className={mode === "edit" ? "gj-fade" : "hidden"}>
          <div className="mx-auto flex w-full max-w-[720px] flex-col pt-14 sm:pt-[72px]">
            <div className="flex flex-wrap items-center gap-4 pb-5">
              <button
                type="button"
                onClick={async () => {
                  const f = await pickImage();
                  if (!f) return;
                  try {
                    changeFields({ cover_url: await uploadImage(f, idRef.current) });
                    toast("Miniatura atualizada");
                  } catch (e) {
                    toast(e instanceof Error ? e.message : "Falha no upload", "error");
                  }
                }}
                className="flex items-center gap-1.5 text-xs text-blue-fantastic/70 transition hover:text-blue-fantastic"
              >
                {fields.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={fields.cover_url} alt="" className="h-5 w-9 rounded-[4px] object-cover ring-1 ring-oatmeal/60" />
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="3" />
                    <circle cx="9" cy="9" r="2" />
                    <path d="m21 15-5-5L5 21" />
                  </svg>
                )}
                miniatura
              </button>
              <label className="flex items-center gap-1.5 text-xs text-blue-fantastic/70 transition hover:text-blue-fantastic">
                <span>#</span>
                <select
                  value={fields.category_id ?? ""}
                  onChange={(e) => changeFields({ category_id: e.target.value || null })}
                  className="cursor-pointer appearance-none bg-transparent outline-none"
                >
                  <option value="">categoria</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name.toLowerCase()}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <AutoTextarea
              value={fields.title}
              onChange={(v) => changeFields({ title: v.slice(0, 200) })}
              placeholder="Título do artigo"
              onEnter={() => document.getElementById("gj-subtitle")?.focus()}
              className="font-sans text-[34px] font-bold leading-[42px] tracking-[-0.025em] text-blue-fantastic placeholder:text-blue-fantastic/25 sm:text-[44px] sm:leading-[52px]"
            />
            <div id="gj-subtitle-wrap" className="pt-3">
              <AutoTextarea
                value={fields.description}
                onChange={(v) => changeFields({ description: v.slice(0, 300) })}
                placeholder="Descrição curta (aparece no card e no Google)"
                onEnter={() => editor?.commands.focus("start")}
                className="font-sans text-xl leading-[30px] text-blue-fantastic/60 placeholder:text-blue-fantastic/25"
              />
            </div>
            <div className="mt-8 h-px bg-oatmeal/50" />
            <div className="gj-editor relative pt-9">
              <EditorContent editor={editor} />
              {editor && <FormatToolbar editor={editor as Editor} />}
              {editor && <TableToolbar editor={editor as Editor} />}
            </div>
          </div>
        </div>

        {mode === "preview" && (
          <div className="gj-fade mx-auto w-full max-w-[720px] pb-32 pt-14 sm:pt-[72px]">
            <p className="mb-6 rounded-xl bg-palladian px-4 py-2.5 text-center text-xs text-blue-fantastic/65 ring-1 ring-oatmeal/50">
              Prévia: é assim que o leitor vai ver {status === "published" ? "depois de atualizar" : "depois de publicar"}.
            </p>
            <div className="flex flex-col pb-10">
              <span className="pb-5 text-[13px] text-blue-fantastic/60">← artigos{category ? ` / ${category.name.toLowerCase()}` : ""}</span>
              <h1 className="font-sans text-[34px] font-bold leading-[40px] tracking-[-0.025em] sm:text-[44px] sm:leading-[52px]">{fields.title || "Sem título"}</h1>
              {fields.description && <p className="pt-3 font-sans text-xl leading-[30px] text-blue-fantastic/60">{fields.description}</p>}
              <span className="pt-4 text-[13px] text-blue-fantastic/60">
                {formatDate(publishedAt ?? new Date().toISOString())} · {Math.max(1, Math.ceil(docToText(previewDoc).split(/\s+/).filter(Boolean).length / 200))} min de leitura
              </span>
            </div>
            <ArticleBody doc={previewDoc} />
          </div>
        )}
      </main>

      {slash.open && mode === "edit" && (
        <SlashMenu
          state={slash}
          items={filtered}
          selected={Math.min(slashSel, Math.max(0, filtered.length - 1))}
          onHover={setSlashSel}
          onPick={runItem}
          onLibrary={() => {
            const ed = editorRef.current;
            const s = slashRef.current.slash;
            setSlash((x) => ({ ...x, open: false }));
            if (!ed) return;
            ed.chain().focus().deleteRange({ from: s.from, to: s.to }).run();
            openLibrary((c) => ed.chain().focus().insertContent({ type: "interactive", attrs: { html: c.html, name: c.name, componentId: c.id } }).run());
          }}
        />
      )}

      <PublishDialog
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        fields={fields}
        onChange={changeFields}
        categories={categories}
        articleId={id}
        status={status}
        publishedAt={publishedAt}
        onPublish={publish}
        onUnpublish={unpublish}
        busy={publishing}
        onError={(m) => toast(m, "error")}
      />

      <LibraryPicker
        open={!!library}
        onClose={() => setLibrary(null)}
        components={components}
        onPick={(c) => {
          library?.onPick(c);
          setLibrary(null);
        }}
      />

      {toastMsg && <Toast key={toastMsg.key} message={toastMsg.message} tone={toastMsg.tone} onDone={() => setToastState(null)} />}
    </EditorContext.Provider>
  );
}
