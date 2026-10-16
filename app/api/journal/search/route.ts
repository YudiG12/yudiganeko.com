import { NextResponse } from "next/server";
import { formatDate } from "@/lib/journal/content";
import { getCategories, searchArticles } from "@/lib/journal/queries";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") ?? "";
  try {
    const [results, categories] = await Promise.all([searchArticles(q, 8), getCategories()]);
    const byId = new Map(categories.map((c) => [c.id, c.name]));
    return NextResponse.json(
      {
        results: results.map((a) => ({
          slug: a.slug,
          title: a.title,
          description: a.description,
          category: a.category_id ? byId.get(a.category_id) ?? null : null,
          date: formatDate(a.published_at),
          minutes: a.reading_minutes,
        })),
      },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
    );
  } catch {
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}
