import "server-only";
import { getSupabase } from "./supabase";
import type { AdminArticleRow, Article, InteractiveComponent } from "./types";

/**
 * Chamadas administrativas. Só são usadas por server actions que já passaram por requireAdmin();
 * o banco ainda exige o JOURNAL_WRITE_TOKEN em cada função.
 */
function token() {
  const t = process.env.JOURNAL_WRITE_TOKEN;
  if (!t) throw new Error("Falta JOURNAL_WRITE_TOKEN no ambiente.");
  return t;
}

async function rpc<T>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await getSupabase().rpc(fn, { p_token: token(), ...args });
  if (error) {
    if (error.code === "23505") throw new Error("Já existe um artigo com esse endereço.");
    if (error.code === "42501") throw new Error("Sem permissão para salvar.");
    throw new Error(error.message);
  }
  return data as T;
}

export const adminApi = {
  listArticles: () => rpc<AdminArticleRow[]>("ganeko_journal_admin_list_articles"),
  getArticle: (id: string) => rpc<Article | null>("ganeko_journal_admin_get_article", { p_id: id }),
  createArticle: (slug: string, title: string) =>
    rpc<string>("ganeko_journal_admin_create_article", { p_slug: slug, p_title: title }),
  updateArticle: (id: string, patch: Record<string, unknown>) =>
    rpc<string>("ganeko_journal_admin_update_article", { p_id: id, p_patch: patch }),
  setStatus: (id: string, status: "draft" | "published") =>
    rpc<{ status: string; published_at: string | null; updated_at: string }>("ganeko_journal_admin_set_status", {
      p_id: id,
      p_status: status,
    }),
  deleteArticle: (id: string) => rpc<null>("ganeko_journal_admin_delete_article", { p_id: id }),
  cleanupEmptyDrafts: () => rpc<number>("ganeko_journal_admin_cleanup_empty"),
  listComponents: () => rpc<InteractiveComponent[]>("ganeko_journal_admin_list_components"),
  saveComponent: (id: string | null, name: string, html: string) =>
    rpc<InteractiveComponent>("ganeko_journal_admin_save_component", { p_id: id, p_name: name, p_html: html }),
  deleteComponent: (id: string) => rpc<null>("ganeko_journal_admin_delete_component", { p_id: id }),
  uploadTicket: (path: string) => rpc<null>("ganeko_journal_admin_upload_ticket", { p_path: path }),
  saveCategory: (id: string | null, name: string, slug: string, position: number) =>
    rpc<string>("ganeko_journal_admin_save_category", { p_id: id, p_name: name, p_slug: slug, p_position: position }),
  deleteCategory: (id: string) => rpc<null>("ganeko_journal_admin_delete_category", { p_id: id }),
};
