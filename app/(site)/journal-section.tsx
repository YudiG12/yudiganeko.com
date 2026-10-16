import ArticleCard from "@/components/journal/article-card";
import ArticleCarousel from "@/components/journal/article-carousel";
import { getPublishedArticles } from "@/lib/journal/queries";
import type { ArticleSummary } from "@/lib/journal/types";

// Seção "Artigos" da home (logo depois da hero): os artigos publicados mais recentes do Ganeko Journal.
export default async function JournalSection() {
  let articles: ArticleSummary[] = [];
  try {
    articles = await getPublishedArticles({ featuredOnly: true, limit: 12 });
  } catch (e) {
    console.error("[journal] falha ao carregar artigos da home", e);
  }
  if (articles.length === 0) return null;

  return (
    <section id="artigos" aria-labelledby="artigos-titulo" className="mt-16 lg:mt-0 mb-20 scroll-mt-10 text-center">
      <h2 id="artigos-titulo" className="font-bold text-2xl text-blue-fantastic">
        Artigos
      </h2>
      <p className="mt-2 text-sm sm:text-base text-blue-fantastic/70">Compartilhando o que aprendi</p>
      <ArticleCarousel>
        {articles.map((a, i) => (
          <div key={a.id} data-card className="w-[78vw] max-w-[300px] shrink-0 snap-start sm:w-[300px]">
            <ArticleCard article={a} priority={i < 2} />
          </div>
        ))}
      </ArticleCarousel>
    </section>
  );
}
