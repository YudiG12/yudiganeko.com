import { notFound } from "next/navigation";
import ArticleEditor from "@/components/journal/editor/article-editor-loader";
import { adminApi } from "@/lib/journal/admin";
import { isAdmin } from "@/lib/journal/auth";
import { getCategories } from "@/lib/journal/queries";

type Props = { params: Promise<{ id: string }> };

export default async function EditArticlePage({ params }: Props) {
  if (!(await isAdmin())) return null;
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [article, categories, components] = await Promise.all([adminApi.getArticle(id), getCategories(), adminApi.listComponents()]);
  if (!article) notFound();
  return <ArticleEditor key={article.id} article={article} categories={categories} initialComponents={components} />;
}
