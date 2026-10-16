import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ArticleBody from "@/components/journal/article-body";
import ArticleCard from "@/components/journal/article-card";
import Reactions from "@/components/journal/reactions";
import ReadingProgress from "@/components/journal/reading-progress";
import { TocCompact, TocSidebar } from "@/components/journal/toc";
import { countInteractive, formatDate, headingIds } from "@/lib/journal/content";
import {
  getCategories,
  getNextArticle,
  getPublishedArticle,
  getPublishedArticles,
  getReactions,
  getRelatedArticles,
} from "@/lib/journal/queries";
import { SITE_URL, articleUrl } from "@/lib/journal/site";

export const revalidate = 300;
export const dynamicParams = true;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  try {
    return (await getPublishedArticles({ limit: 50 })).map((a) => ({ slug: a.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublishedArticle(slug);
  if (!article) return { title: "Artigo não encontrado — Yudi Ganeko", robots: { index: false } };
  const title = article.seo_title || article.title;
  const description = article.seo_description || article.description;
  const url = `${SITE_URL}${articleUrl(article.slug)}`;
  return {
    title: `${title} — Yudi Ganeko`,
    description,
    alternates: { canonical: url },
    authors: [{ name: "Yudi Ganeko", url: SITE_URL }],
    openGraph: {
      type: "article",
      url,
      title,
      description,
      siteName: "Yudi Ganeko",
      locale: "pt_BR",
      publishedTime: article.published_at ?? undefined,
      modifiedTime: article.updated_at,
      authors: ["Yudi Ganeko"],
      images: article.cover_url ? [{ url: article.cover_url, width: 1280, height: 720 }] : undefined,
    },
    twitter: {
      card: article.cover_url ? "summary_large_image" : "summary",
      title,
      description,
      images: article.cover_url ? [article.cover_url] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getPublishedArticle(slug);
  if (!article) notFound();

  const [categories, related, next, reactions] = await Promise.all([
    getCategories(),
    getRelatedArticles(article, 3),
    getNextArticle(article),
    article.allow_reactions ? getReactions(article.id) : Promise.resolve({}),
  ]);
  const category = categories.find((c) => c.id === article.category_id) ?? null;
  const toc = headingIds(article.content);
  const interactions = countInteractive(article.content);
  const url = `${SITE_URL}${articleUrl(article.slug)}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.description,
    datePublished: article.published_at,
    dateModified: article.updated_at,
    mainEntityOfPage: url,
    url,
    inLanguage: "pt-BR",
    image: article.cover_url ? [article.cover_url] : undefined,
    articleSection: category?.name,
    wordCount: article.content_text.split(/\s+/).filter(Boolean).length,
    timeRequired: `PT${article.reading_minutes}M`,
    author: { "@type": "Person", name: "Yudi Ganeko", url: SITE_URL },
    publisher: { "@type": "Person", name: "Yudi Ganeko", url: SITE_URL },
  };

  return (
    <>
      <ReadingProgress />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <main className="overflow-x-clip px-4 pb-24 pt-24 sm:pt-28">
        <div className="mx-auto grid w-full max-w-[1200px] gap-x-10 xl:grid-cols-[1fr_720px_1fr]">
          <div className="hidden xl:block" />
          <article id="gj-article" className="min-w-0 w-full max-w-[720px] justify-self-center">
            <header className="gj-rise flex flex-col pb-10">
              <div className="flex items-center gap-3 pb-5 font-mono text-[13px]">
                <Link href="/journal" className="text-blue-fantastic/60 transition-colors hover:text-blue-fantastic">
                  ← artigos
                </Link>
                {category && (
                  <>
                    <span className="text-oatmeal">/</span>
                    <Link
                      href={`/journal/categoria/${category.slug}`}
                      className="text-truffle-trouble transition-opacity hover:opacity-80"
                    >
                      {category.name.toLowerCase()}
                    </Link>
                  </>
                )}
              </div>
              <h1 className="font-sans text-[34px] font-bold leading-[40px] tracking-[-0.025em] text-blue-fantastic text-balance sm:text-[44px] sm:leading-[52px]">
                {article.title}
              </h1>
              {article.description && (
                <p className="pt-3 font-sans text-lg leading-7 text-blue-fantastic/60 text-pretty sm:text-xl sm:leading-[30px]">
                  {article.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 pt-4 font-mono text-[13px] text-blue-fantastic/60">
                <time dateTime={article.published_at ?? undefined}>{formatDate(article.published_at)}</time>
                <span className="text-oatmeal">·</span>
                <span>{article.reading_minutes} min de leitura</span>
                {interactions > 0 && (
                  <>
                    <span className="text-oatmeal">·</span>
                    <span className="inline-flex items-center gap-1.5 text-truffle-trouble">
                      <span className="flex h-3.5 w-3.5 items-center justify-center rounded-[4px] bg-truffle-trouble">
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m9 9 5 12 1.8-5.2L21 14z" />
                        </svg>
                      </span>
                      {interactions} {interactions === 1 ? "interação" : "interações"}
                    </span>
                  </>
                )}
              </div>
            </header>

            <ArticleBody doc={article.content} />

            {article.allow_reactions && <div className="mt-16"><Reactions articleId={article.id} initial={reactions} /></div>}

            <footer className="flex flex-col gap-10 pt-14">
              {next && (
                <Link
                  href={articleUrl(next.slug)}
                  className="group flex items-center justify-between gap-6 rounded-2xl px-5 py-4 ring-1 ring-oatmeal/60 transition-all duration-300 hover:-translate-y-0.5 hover:bg-palladian hover:shadow-md"
                >
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="font-mono text-[11px] tracking-[0.08em] text-blue-fantastic/50">PRÓXIMO ARTIGO</span>
                    <span className="truncate font-sans text-[17px] font-semibold text-blue-fantastic transition-colors group-hover:text-truffle-trouble">
                      {next.title}
                    </span>
                  </span>
                  <span aria-hidden className="font-mono text-lg text-truffle-trouble transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </Link>
              )}
              {related.length > 0 && (
                <section aria-label="Continue lendo" className="flex flex-col gap-6">
                  <h2 className="font-mono text-base font-bold text-blue-fantastic">Continue lendo</h2>
                  <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 xl:-mx-20 xl:grid-cols-3">
                    {related.map((a) => (
                      <ArticleCard key={a.id} article={a} sizes="(max-width: 640px) 100vw, 280px" />
                    ))}
                  </div>
                </section>
              )}
              <Link
                href="/journal"
                className="self-center font-mono text-sm text-truffle-trouble underline decoration-truffle-trouble/35 underline-offset-4 hover:decoration-truffle-trouble"
              >
                ← ver todos os artigos
              </Link>
            </footer>
          </article>
          <aside className="hidden xl:block">
            <TocSidebar items={toc} />
          </aside>
        </div>
        <TocCompact items={toc} />
      </main>
    </>
  );
}
