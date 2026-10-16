import ArticleCard from "@/components/journal/article-card";
import CategoryFilter from "@/components/journal/category-filter";
import type { ArticleSummary, Category } from "@/lib/journal/types";

export default function Listing({
  title,
  subtitle,
  articles,
  categories,
  activeSlug,
}: {
  title: string;
  subtitle: string;
  articles: ArticleSummary[];
  categories: Category[];
  activeSlug: string | null;
}) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1040px] flex-col px-4 pb-24 pt-28 font-mono tracking-wide sm:pt-32">
      <header className="gj-rise flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold text-blue-fantastic sm:text-[28px]">{title}</h1>
        <p className="text-sm text-blue-fantastic/70 sm:text-base">{subtitle}</p>
      </header>
      <nav aria-label="Categorias" className="mt-8">
        <CategoryFilter categories={categories} activeSlug={activeSlug} />
      </nav>
      {articles.length === 0 ? (
        <div className="gj-rise mt-20 flex flex-col items-center gap-2 text-center">
          <span className="text-3xl text-oatmeal">∅</span>
          <p className="text-sm text-blue-fantastic/70">Ainda não tem artigo publicado aqui.</p>
        </div>
      ) : (
        <ul className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((a, i) => (
            <li key={a.id} className="gj-rise" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
              <ArticleCard article={a} sizes="(max-width: 640px) 100vw, 330px" priority={i < 3} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
