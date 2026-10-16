import { isAdmin } from "@/lib/journal/auth";
import NewArticle from "./new-article";

// Cria o rascunho antes de abrir o editor: assim a URL já é a definitiva e nada se perde.
export default async function NewArticlePage() {
  if (!(await isAdmin())) return null;
  return <NewArticle />;
}
