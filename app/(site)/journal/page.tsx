import type { Metadata } from "next";
import { getCategories, getPublishedArticles } from "@/lib/journal/queries";
import { SITE_URL } from "@/lib/journal/site";
import Listing from "./listing";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Artigos — Yudi Ganeko",
  description: "Compartilhando o que aprendi: programação, sistemas, IA e carreira, com exemplos interativos.",
  alternates: { canonical: `${SITE_URL}/journal` },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/journal`,
    title: "Artigos — Yudi Ganeko",
    description: "Compartilhando o que aprendi.",
    siteName: "Yudi Ganeko",
    locale: "pt_BR",
  },
};

export default async function JournalPage() {
  const [articles, categories] = await Promise.all([getPublishedArticles(), getCategories()]);
  return (
    <Listing
      title="Artigos"
      subtitle="Compartilhando o que aprendi"
      articles={articles}
      categories={categories}
      activeSlug={null}
    />
  );
}
