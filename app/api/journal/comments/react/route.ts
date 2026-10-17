import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/journal/supabase";
import { COMMENT_REACTIONS } from "@/lib/journal/types";

// Reação anônima a um comentário. O banco valida emoji, delta e se o artigo está publicado.
export async function POST(req: Request) {
  let body: { commentId?: unknown; emoji?: unknown; delta?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "json inválido" }, { status: 400 });
  }
  const { commentId, emoji, delta } = body;
  if (
    typeof commentId !== "string" ||
    !/^[0-9a-f-]{36}$/i.test(commentId) ||
    !COMMENT_REACTIONS.includes(emoji as (typeof COMMENT_REACTIONS)[number]) ||
    (delta !== 1 && delta !== -1)
  ) {
    return NextResponse.json({ error: "dados inválidos" }, { status: 400 });
  }
  const { data, error } = await getSupabase().rpc("ganeko_journal_comment_react", {
    p_comment_id: commentId,
    p_emoji: emoji,
    p_delta: delta,
  });
  if (error) return NextResponse.json({ error: "não foi possível reagir" }, { status: 400 });
  return NextResponse.json({ count: data });
}
