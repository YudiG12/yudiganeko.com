import "server-only";
import { cache } from "react";
import { getSupabase, journalConfigured } from "./supabase";
import type { Article, ArticleSummary, Category, CommentReactionEmoji, JournalComment, ReactionEmoji } from "./types";

const SUMMARY =
  "id, slug, title, description, category_id, status, cover_url, reading_minutes, published_at, updated_at";

// Leituras públicas: o RLS já garante status = 'published'; o filtro explícito deixa a intenção clara
// e usa o índice (status, published_at).

export const getCategories = cache(async (): Promise<Category[]> => {
  if (!journalConfigured()) return [];
  const { data, error } = await getSupabase()
    .from("ganeko_journal_categories")
    .select("id, slug, name, position")
    .order("position");
  if (error) throw error;
  return data ?? [];
});

export async function getPublishedArticles(opts: { categoryId?: string; limit?: number; featuredOnly?: boolean } = {}) {
  if (!journalConfigured()) return [] as ArticleSummary[];
  let q = getSupabase()
    .from("ganeko_journal_articles")
    .select(SUMMARY)
    .eq("status", "published")
    .order("published_at", { ascending: false });
  if (opts.categoryId) q = q.eq("category_id", opts.categoryId);
  if (opts.featuredOnly) q = q.eq("featured", true);
  if (opts.limit) q = q.limit(opts.limit);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as ArticleSummary[];
}

export const getPublishedArticle = cache(async (slug: string): Promise<Article | null> => {
  if (!journalConfigured()) return null;
  const { data, error } = await getSupabase()
    .from("ganeko_journal_articles")
    .select(`${SUMMARY}, content, content_text, seo_title, seo_description, featured, allow_reactions, created_at`)
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return (data as Article | null) ?? null;
});

/** Mesma categoria primeiro, depois os mais recentes. */
export async function getRelatedArticles(article: ArticleSummary, limit = 3) {
  const all = await getPublishedArticles({ limit: 24 });
  const others = all.filter((a) => a.id !== article.id);
  const same = others.filter((a) => article.category_id && a.category_id === article.category_id);
  const rest = others.filter((a) => !same.includes(a));
  return [...same, ...rest].slice(0, limit);
}

/** Artigo publicado imediatamente anterior (mais antigo) — "próximo" na leitura. */
export async function getNextArticle(article: ArticleSummary) {
  if (!article.published_at) return null;
  const { data } = await getSupabase()
    .from("ganeko_journal_articles")
    .select(SUMMARY)
    .eq("status", "published")
    .lt("published_at", article.published_at)
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as ArticleSummary | null) ?? null;
}

export async function getReactions(articleId: string) {
  const { data } = await getSupabase()
    .from("ganeko_journal_reactions")
    .select("emoji, count")
    .eq("article_id", articleId);
  const out: Partial<Record<ReactionEmoji, number>> = {};
  for (const r of data ?? []) out[r.emoji as ReactionEmoji] = r.count;
  return out;
}

/** Comentários de um artigo publicado (o RLS esconde os de rascunhos), já com as reações. */
export async function getComments(articleId: string): Promise<JournalComment[]> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("ganeko_journal_comments")
    .select("id, parent_id, author_name, is_author, body, created_at")
    .eq("article_id", articleId)
    .order("created_at", { ascending: true })
    .limit(1000);
  if (error) throw error;
  const rows = data ?? [];
  const reactions = new Map<string, Partial<Record<CommentReactionEmoji, number>>>();
  for (let i = 0; i < rows.length; i += 200) {
    const ids = rows.slice(i, i + 200).map((r) => r.id);
    const { data: rs } = await sb
      .from("ganeko_journal_comment_reactions")
      .select("comment_id, emoji, count")
      .in("comment_id", ids)
      .gt("count", 0);
    for (const r of rs ?? []) {
      const m = reactions.get(r.comment_id) ?? {};
      m[r.emoji as CommentReactionEmoji] = r.count;
      reactions.set(r.comment_id, m);
    }
  }
  return rows.map((r) => ({ ...r, reactions: reactions.get(r.id) ?? {} }));
}

/** Busca por título, descrição e conteúdo (tsvector em português + prefixo no título). */
export async function searchArticles(raw: string, limit = 12) {
  if (!journalConfigured()) return [] as ArticleSummary[];
  const q = raw.normalize("NFC").replace(/[^\p{L}\p{N}\s-]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 80);
  if (!q) return [];
  const words = q.split(" ").filter(Boolean);
  const ilike = words.map((w) => `title.ilike.%${w}%`).join(",");
  const fts = `search.wfts(portuguese).${q.replace(/ /g, "+")}`;
  const { data, error } = await getSupabase()
    .from("ganeko_journal_articles")
    .select(SUMMARY)
    .eq("status", "published")
    .or(`${fts},${ilike},description.ilike.%${q}%`)
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as ArticleSummary[];
}
