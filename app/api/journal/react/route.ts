import { NextResponse } from "next/server";
import { getSupabase, journalConfigured } from "@/lib/journal/supabase";
import { REACTIONS } from "@/lib/journal/types";

// Reação anônima a um artigo publicado. O banco valida emoji, delta e status do artigo.
export async function POST(req: Request) {
  if (!journalConfigured()) return NextResponse.json({ error: "indisponível" }, { status: 503 });
  let body: { articleId?: unknown; emoji?: unknown; delta?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "json inválido" }, { status: 400 });
  }
  const { articleId, emoji, delta } = body;
  if (
    typeof articleId !== "string" ||
    !/^[0-9a-f-]{36}$/i.test(articleId) ||
    !REACTIONS.includes(emoji as (typeof REACTIONS)[number]) ||
    (delta !== 1 && delta !== -1)
  ) {
    return NextResponse.json({ error: "dados inválidos" }, { status: 400 });
  }
  const { data, error } = await getSupabase().rpc("ganeko_journal_react", {
    p_article_id: articleId,
    p_emoji: emoji,
    p_delta: delta,
  });
  if (error) return NextResponse.json({ error: "não foi possível reagir" }, { status: 400 });
  return NextResponse.json({ count: data });
}
