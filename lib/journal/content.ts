import type { JSONContent } from "./types";

export function slugify(input: string, max = 80) {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max)
    .replace(/-+$/g, "");
}

export function nodeText(node: JSONContent | undefined): string {
  if (!node) return "";
  if (node.type === "text") return node.text ?? "";
  if (node.type === "hardBreak") return "\n";
  return (node.content ?? []).map(nodeText).join("");
}

const BLOCK_TYPES = new Set([
  "paragraph", "heading", "blockquote", "listItem", "codeBlock", "tableCell", "tableHeader", "callout",
]);

/** Texto puro do documento — alimenta a busca e o tempo de leitura. */
export function docToText(doc: JSONContent | undefined): string {
  const out: string[] = [];
  const walk = (n: JSONContent) => {
    if (n.type === "interactive") {
      const name = String(n.attrs?.name ?? "");
      const caption = String(n.attrs?.caption ?? "");
      if (name || caption) out.push([name, caption].filter(Boolean).join(". "));
      return;
    }
    if (n.type === "image" || n.type === "diagram" || n.type === "youtube") {
      const caption = String(n.attrs?.caption ?? n.attrs?.title ?? "");
      if (caption) out.push(caption);
      return;
    }
    if (n.type && BLOCK_TYPES.has(n.type) && !(n.content ?? []).some((c) => c.type && BLOCK_TYPES.has(c.type))) {
      out.push(nodeText(n));
      return;
    }
    (n.content ?? []).forEach(walk);
  };
  if (doc) walk(doc);
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

export type TocItem = { id: string; text: string; level: number };

/** Ids estáveis dos títulos — usados pelo renderizador e pelo índice lateral. */
export function headingIds(doc: JSONContent | undefined): TocItem[] {
  const items: TocItem[] = [];
  const used = new Map<string, number>();
  for (const n of doc?.content ?? []) {
    if (n.type !== "heading") continue;
    const text = nodeText(n).trim();
    if (!text) continue;
    const base = slugify(text, 60) || "secao";
    const count = used.get(base) ?? 0;
    used.set(base, count + 1);
    items.push({ id: count ? `${base}-${count + 1}` : base, text, level: Number(n.attrs?.level ?? 2) });
  }
  return items;
}

export function countInteractive(doc: JSONContent | undefined): number {
  let total = 0;
  const walk = (n: JSONContent) => {
    if (n.type === "interactive") total++;
    (n.content ?? []).forEach(walk);
  };
  if (doc) walk(doc);
  return total;
}

const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export function formatDate(iso: string | null | undefined, withYear = true) {
  if (!iso) return "";
  const d = new Date(iso);
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${day} ${MONTHS[d.getUTCMonth()]}${withYear ? ` ${d.getUTCFullYear()}` : ""}`;
}

export function emptyDoc(): JSONContent {
  return { type: "doc", content: [{ type: "paragraph" }] };
}

export function youtubeId(input: string): string | null {
  const s = input.trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  try {
    const u = new URL(s);
    if (u.hostname.endsWith("youtu.be")) return u.pathname.slice(1, 12) || null;
    if (u.hostname.includes("youtube.com")) {
      if (u.pathname.startsWith("/watch")) return u.searchParams.get("v");
      const m = u.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{11})/);
      if (m) return m[1];
    }
  } catch {
    return null;
  }
  return null;
}
