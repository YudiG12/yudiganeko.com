import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategories, getPublishedArticles } from "@/lib/journal/queries";
import { SITE_URL } from "@/lib/journal/site";
import Listing from "../../listing";

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = (await getCategories()).find((c) => c.slug === slug);
  if (!category) return {};
  const url = `${SITE_URL}/journal/categoria/${slug}`;
  return {
    title: `${category.name} — Artigos — Yudi Ganeko`,
    description: `Artigos sobre ${category.name.toLowerCase()} no Ganeko Journal.`,
    alternates: { canonical: url },
    openGraph: { type: "website", url, title: `${category.name} — Artigos`, siteName: "Yudi Ganeko", locale: "pt_BR" },
  };
}

export async function generateStaticParams() {
  return (await getCategories()).map((c) => ({ slug: c.slug }));
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const categories = await getCategories();
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();
  const articles = await getPublishedArticles({ categoryId: category.id });
  return (
    <Listing
      title={category.name}
      subtitle="Compartilhando o que aprendi"
      articles={articles}
      categories={categories}
      activeSlug={slug}
    />
  );
}
