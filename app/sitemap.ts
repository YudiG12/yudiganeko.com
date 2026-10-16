import type { MetadataRoute } from "next";
import { getCategories, getPublishedArticles } from "@/lib/journal/queries";
import { SITE_URL, articleUrl } from "@/lib/journal/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/journal`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/media-kit`, changeFrequency: "monthly", priority: 0.5 },
  ];
  try {
    const [articles, categories] = await Promise.all([getPublishedArticles(), getCategories()]);
    return [
      ...base,
      ...categories.map((c) => ({
        url: `${SITE_URL}/journal/categoria/${c.slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.5,
      })),
      ...articles.map((a) => ({
        url: `${SITE_URL}${articleUrl(a.slug)}`,
        lastModified: a.updated_at,
        changeFrequency: "monthly" as const,
        priority: 0.7,
        images: a.cover_url ? [a.cover_url] : undefined,
      })),
    ];
  } catch {
    return base;
  }
}
