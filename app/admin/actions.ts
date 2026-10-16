"use server";

import { revalidatePath } from "next/cache";
import { adminApi } from "@/lib/journal/admin";
import { requireAdmin } from "@/lib/journal/auth";
import { docToText, slugify } from "@/lib/journal/content";
import { articleUrl } from "@/lib/journal/site";
import { publicStorageConfig } from "@/lib/journal/supabase";
import type { JSONContent } from "@/lib/journal/types";

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

async function run<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    await requireAdmin();
    return { ok: true, data: await fn() };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Algo deu errado." };
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function assertId(id: string) {
  if (!UUID.test(id)) throw new Error("Id inválido.");
}

export type ArticlePatch = Partial<{
  title: string;
  description: string;
  slug: string;
  category_id: string | null;
  content: JSONContent;
  cover_url: string | null;
  seo_title: string;
  seo_description: string;
  featured: boolean;
  allow_reactions: boolean;
}>;

/** Valida e normaliza o que pode ser salvo — nada além dessas chaves chega ao banco. */
function cleanPatch(p: ArticlePatch) {
  const out: Record<string, unknown> = {};
  const str = (v: unknown, max: number) => String(v ?? "").slice(0, max);
  if ("title" in p) out.title = str(p.title, 200);
  if ("description" in p) out.description = str(p.description, 300);
  if ("slug" in p) {
    const s = slugify(String(p.slug ?? ""), 120);
    if (!s) throw new Error("O endereço não pode ficar vazio.");
    out.slug = s;
  }
  if ("category_id" in p) {
    if (p.category_id && !UUID.test(p.category_id)) throw new Error("Categoria inválida.");
    out.category_id = p.category_id || null;
  }
  if ("content" in p) {
    const doc = p.content;
    if (!doc || doc.type !== "doc" || !Array.isArray(doc.content)) throw new Error("Conteúdo inválido.");
    const size = JSON.stringify(doc).length;
    if (size > 3_000_000) throw new Error("O artigo ficou grande demais (máx. 3 MB).");
    out.content = doc;
    out.content_text = docToText(doc).slice(0, 400_000);
  }
  if ("cover_url" in p) {
    const u = p.cover_url ? String(p.cover_url) : "";
    if (u && !/^https:\/\//.test(u)) throw new Error("A miniatura precisa ser uma URL https.");
    out.cover_url = u || null;
  }
  if ("seo_title" in p) out.seo_title = str(p.seo_title, 200);
  if ("seo_description" in p) out.seo_description = str(p.seo_description, 300);
  if ("featured" in p) out.featured = Boolean(p.featured);
  if ("allow_reactions" in p) out.allow_reactions = Boolean(p.allow_reactions);
  return out;
}

function revalidatePublic(slug?: string) {
  revalidatePath("/");
  revalidatePath("/journal", "layout");
  revalidatePath("/sitemap.xml");
  if (slug) revalidatePath(articleUrl(slug));
}

export async function createArticleAction(patch: ArticlePatch) {
  return run(async () => {
    const clean = cleanPatch(patch);
    const base = slugify(String(clean.title ?? ""), 100) || "rascunho";
    const slug = `${base}-${crypto.randomUUID().slice(0, 6)}`;
    const id = await adminApi.createArticle(slug, String(clean.title ?? ""));
    const updated_at = Object.keys(clean).length ? await adminApi.updateArticle(id, clean) : new Date().toISOString();
    return { id, slug, updated_at };
  });
}

export async function saveArticleAction(id: string, patch: ArticlePatch, publishedSlug?: string | null) {
  return run(async () => {
    assertId(id);
    const updated_at = await adminApi.updateArticle(id, cleanPatch(patch));
    // Artigo no ar: a versão pública atualiza na hora.
    if (publishedSlug) {
      revalidatePublic(publishedSlug);
      if (patch.slug && patch.slug !== publishedSlug) revalidatePublic(String(patch.slug));
    }
    return { updated_at };
  });
}

export async function setStatusAction(id: string, status: "draft" | "published", slug: string) {
  return run(async () => {
    assertId(id);
    const r = await adminApi.setStatus(id, status);
    revalidatePublic(slug);
    revalidatePath("/admin/artigos");
    return r;
  });
}

export async function deleteArticleAction(id: string, slug: string) {
  return run(async () => {
    assertId(id);
    await adminApi.deleteArticle(id);
    revalidatePublic(slug);
    revalidatePath("/admin/artigos");
    return null;
  });
}

const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

/** Libera um caminho de upload por 10 min; o navegador sobe o arquivo direto no Storage. */
export async function requestUploadAction(articleId: string | null, mime: string, size: number) {
  return run(async () => {
    const ext = EXT[mime];
    if (!ext) throw new Error("Formato não suportado. Use PNG, JPG, WebP, GIF ou AVIF.");
    if (size > 10 * 1024 * 1024) throw new Error("Imagem maior que 10 MB.");
    const folder = articleId && UUID.test(articleId) ? articleId : crypto.randomUUID();
    const path = `articles/${folder}/${crypto.randomUUID()}.${ext}`;
    await adminApi.uploadTicket(path);
    const cfg = publicStorageConfig();
    return { ...cfg, path, publicUrl: `${cfg.url}/storage/v1/object/public/${cfg.bucket}/${path}` };
  });
}

// ── Componentes interativos ─────────────────────────────────────────────

function cleanComponent(name: string, html: string) {
  const n = String(name ?? "").trim().slice(0, 80) || "Componente sem nome";
  const h = String(html ?? "");
  if (!h.trim()) throw new Error("Cole o código do componente.");
  if (h.length > 500_000) throw new Error("Código grande demais (máx. 500 mil caracteres).");
  return { n, h };
}

export async function listComponentsAction() {
  return run(() => adminApi.listComponents());
}

export async function saveComponentAction(id: string | null, name: string, html: string) {
  return run(async () => {
    if (id) assertId(id);
    const { n, h } = cleanComponent(name, html);
    const saved = await adminApi.saveComponent(id, n, h);
    revalidatePath("/admin/componentes");
    return saved;
  });
}

export async function duplicateComponentAction(id: string) {
  return run(async () => {
    assertId(id);
    const all = await adminApi.listComponents();
    const src = all.find((c) => c.id === id);
    if (!src) throw new Error("Componente não encontrado.");
    const copy = await adminApi.saveComponent(null, `${src.name} (cópia)`.slice(0, 80), src.html);
    revalidatePath("/admin/componentes");
    return copy;
  });
}

export async function deleteComponentAction(id: string) {
  return run(async () => {
    assertId(id);
    await adminApi.deleteComponent(id);
    revalidatePath("/admin/componentes");
    return null;
  });
}

// ── Categorias ──────────────────────────────────────────────────────────

export async function saveCategoryAction(id: string | null, name: string, position: number) {
  return run(async () => {
    if (id) assertId(id);
    const n = String(name ?? "").trim().slice(0, 60);
    if (!n) throw new Error("Dê um nome à categoria.");
    const slug = slugify(n, 80);
    const saved = await adminApi.saveCategory(id, n, slug, Number(position) || 0);
    revalidatePublic();
    revalidatePath("/admin/artigos");
    return saved;
  });
}

export async function deleteCategoryAction(id: string) {
  return run(async () => {
    assertId(id);
    await adminApi.deleteCategory(id);
    revalidatePublic();
    revalidatePath("/admin/artigos");
    return null;
  });
}
