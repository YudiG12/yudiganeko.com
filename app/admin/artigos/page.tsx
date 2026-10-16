import AdminBar from "@/components/journal/admin/admin-bar";
import ArticlesAdmin from "@/components/journal/admin/articles-admin";
import { adminApi } from "@/lib/journal/admin";
import { isAdmin } from "@/lib/journal/auth";
import { getCategories } from "@/lib/journal/queries";

export default async function AdminArticlesPage() {
  if (!(await isAdmin())) return null;
  await adminApi.cleanupEmptyDrafts().catch(() => 0);
  const [articles, categories] = await Promise.all([adminApi.listArticles(), getCategories()]);
  return (
    <>
      <AdminBar />
      <ArticlesAdmin articles={articles} categories={categories} />
    </>
  );
}
