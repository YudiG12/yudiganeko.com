import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { adminApi } from "@/lib/journal/admin";
import { isAdmin } from "@/lib/journal/auth";
import { getComments } from "@/lib/journal/queries";
import { getSupabase } from "@/lib/journal/supabase";

// Comentários dos leitores. Sempre dinâmico: a página do artigo é estática (ISR), os comentários não.
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f-]{36}$/i;
const AUTHOR_NAME = "Yudi Ganeko";

function ipHash(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  return crypto
    .createHash("sha256")
    .update(`${process.env.SESSION_SECRET ?? ""}:${ip}`)
    .digest("hex");
}

export async function GET(req: Request) {
  const articleId = new URL(req.url).searchParams.get("articleId") ?? "";
  if (!UUID.test(articleId)) return NextResponse.json({ error: "dados inválidos" }, { status: 400 });
  try {
    const [comments, admin] = await Promise.all([getComments(articleId), isAdmin()]);
    return NextResponse.json(
      { comments, viewer: { isAdmin: admin, authorName: AUTHOR_NAME } },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json({ error: "não foi possível carregar" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  let body: { articleId?: unknown; parentId?: unknown; name?: unknown; body?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "json inválido" }, { status: 400 });
  }
  const admin = await isAdmin();
  const articleId = body.articleId;
  const parentId = body.parentId ?? null;
  const name = admin ? AUTHOR_NAME : typeof body.name === "string" ? body.name.replace(/\s+/g, " ").trim() : "";
  const text = typeof body.body === "string" ? body.body.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim() : "";
  if (
    typeof articleId !== "string" ||
    !UUID.test(articleId) ||
    (parentId !== null && (typeof parentId !== "string" || !UUID.test(parentId))) ||
    name.length < 1 ||
    name.length > 60 ||
    text.length < 1 ||
    text.length > 2000
  ) {
    return NextResponse.json({ error: "Escreva seu nome e o comentário (até 2000 caracteres)." }, { status: 400 });
  }
  // Ninguém além do autor assina como ele.
  if (!admin && name.toLowerCase().replace(/\s+/g, "") === AUTHOR_NAME.toLowerCase().replace(/\s+/g, "")) {
    return NextResponse.json({ error: "Esse nome é reservado. Use outro." }, { status: 400 });
  }
  const token = process.env.JOURNAL_WRITE_TOKEN;
  if (!token) return NextResponse.json({ error: "indisponível" }, { status: 503 });
  const { data, error } = await getSupabase().rpc("ganeko_journal_srv_add_comment", {
    p_token: token,
    p_article_id: articleId,
    p_parent_id: parentId,
    p_name: name,
    p_body: text,
    p_ip_hash: ipHash(req),
    p_is_author: admin,
  });
  if (error) {
    if (error.hint === "rate_limited")
      return NextResponse.json({ error: "Calma aí! Espere um pouquinho antes de comentar de novo." }, { status: 429 });
    return NextResponse.json({ error: "Não foi possível comentar agora." }, { status: 400 });
  }
  return NextResponse.json({ comment: { ...(data as object), reactions: {} } });
}

export async function DELETE(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "sem permissão" }, { status: 403 });
  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (!UUID.test(id)) return NextResponse.json({ error: "dados inválidos" }, { status: 400 });
  try {
    await adminApi.deleteComment(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "não foi possível apagar" }, { status: 400 });
  }
}
