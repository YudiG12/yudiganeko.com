"use client";

// Importa um artigo exportado como .zip (um .html + pasta de imagens) ou como .html solto.
// Roda no navegador: descompacta, converte o HTML no documento do editor (Tiptap JSON)
// e transforma cada widget interativo num bloco "interactive" isolado no iframe.

import { unzipSync } from "fflate";
import type { JSONContent } from "./types";

const MAX_TOTAL = 80 * 1024 * 1024;
const IMAGE_MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
};

export type ImportedArticle = {
  title: string;
  description: string;
  content: JSONContent;
  coverUrl: string | null;
};

type Mark = NonNullable<JSONContent["marks"]>[number];
type Upload = (file: File) => Promise<string>;

/** Lê o arquivo escolhido e devolve o HTML principal + as imagens indexadas pelo caminho. */
async function readBundle(file: File) {
  const images = new Map<string, File>();
  if (/\.html?$/i.test(file.name)) return { html: await file.text(), dir: "", images };

  const files = unzipSync(new Uint8Array(await file.arrayBuffer()), {
    filter: (f) => !f.name.startsWith("__MACOSX/") && !f.name.split("/").pop()!.startsWith("."),
  });
  let total = 0;
  for (const data of Object.values(files)) total += data.length;
  if (total > MAX_TOTAL) throw new Error("O .zip descompactado passa de 80 MB.");

  // HTML principal: o mais raso, preferindo index/artigo.
  const htmls = Object.keys(files).filter((p) => /\.html?$/i.test(p));
  if (!htmls.length) throw new Error("Não achei nenhum .html dentro do .zip.");
  const rank = (p: string) => p.split("/").length * 10 - (/(^|\/)(index|artigo|article)\.html?$/i.test(p) ? 5 : 0);
  const main = htmls.sort((a, b) => rank(a) - rank(b))[0];
  const dir = main.includes("/") ? main.slice(0, main.lastIndexOf("/") + 1) : "";

  for (const [path, data] of Object.entries(files)) {
    const mime = IMAGE_MIME[path.split(".").pop()!.toLowerCase()];
    if (mime) images.set(path, new File([data as BlobPart], path.split("/").pop()!, { type: mime }));
  }
  return { html: new TextDecoder().decode(files[main]), dir, images };
}

/** Resolve "assets/x.png", "./assets/x.png" ou "../x.png" em relação à pasta do HTML. */
function resolvePath(dir: string, src: string) {
  const parts = (dir + src.split(/[?#]/)[0]).split("/");
  const out: string[] = [];
  for (const p of parts) {
    if (p === "..") out.pop();
    else if (p && p !== ".") out.push(p);
  }
  return decodeURIComponent(out.join("/"));
}

const WIDGET_SELECTOR = "[data-widget], .widget, .interactive, [data-interactive]";
const BLOCK_TAGS = /^(P|H[1-6]|UL|OL|PRE|TABLE|FIGURE|BLOCKQUOTE|HR|IMG|IFRAME|ASIDE|DIV|SECTION|HEADER|FOOTER|NAV)$/;
const INTERACTIVE_TAGS =new Set(["INPUT", "BUTTON", "SELECT", "TEXTAREA", "CANVAS", "SVG", "svg", "FORM"]);

export async function importArticle(file: File, upload: Upload): Promise<ImportedArticle> {
  const { html, dir, images } = await readBundle(file);
  const doc = new DOMParser().parseFromString(html, "text/html");

  // Cada imagem do pacote sobe uma vez só, mesmo se aparecer repetida.
  const uploaded = new Map<string, Promise<string | null>>();
  const imageUrl = (src: string | null): Promise<string | null> => {
    if (!src) return Promise.resolve(null);
    if (/^https:\/\//i.test(src)) return Promise.resolve(src);
    if (/^(data|blob|http):/i.test(src) || src.startsWith("//")) return Promise.resolve(null);
    const path = resolvePath(dir, src);
    if (!uploaded.has(path)) {
      const f = images.get(path);
      uploaded.set(path, f ? upload(f) : Promise.resolve(null));
    }
    return uploaded.get(path)!;
  };

  const root = doc.querySelector("article") ?? doc.querySelector("main") ?? doc.body;

  // Título e linha fina saem do cabeçalho e não entram no corpo.
  const h1 = root.querySelector("h1");
  const title = h1?.textContent?.trim() ?? doc.title.split(/\s[—|-]\s/)[0].trim();
  const header = h1?.closest("header");
  const lead =
    header?.querySelector(".lead, .subtitle, .description, p") ??
    (h1?.nextElementSibling?.tagName === "P" ? h1.nextElementSibling : null);
  const description = lead?.textContent?.trim() ?? "";
  if (header && root.contains(header) && header !== root) header.remove();
  else {
    h1?.remove();
    lead?.remove();
  }

  // O que todo widget precisa para funcionar sozinho no iframe: o CSS e os scripts da página.
  const styles = [...doc.querySelectorAll("style")].map((s) => s.outerHTML).join("");
  const links = [...doc.querySelectorAll('link[rel="stylesheet"][href^="https://"]')].map((l) => l.outerHTML).join("");
  const scripts = [...doc.querySelectorAll("script")]
    .filter((s) => !s.src || /^https:\/\//i.test(s.src))
    .map((s) => (s.src ? `<script src="${s.getAttribute("src")}"></script>` : `<script>${s.textContent ?? ""}</script>`))
    .join("");
  // Como o script da página mexe em todos os widgets, um elemento que não está neste iframe
  // vira um "dublê" desconectado em vez de quebrar a execução.
  const shim =
    "<script>(function(){var D=Document.prototype,g=D.getElementById,q=D.querySelector;" +
    "D.getElementById=function(i){return g.call(this,i)||document.createElement('input')};" +
    "D.querySelector=function(s){return q.call(this,s)||document.createElement('input')}})();</script>";
  const frameReset =
    "<style>body{padding:0!important;margin:0!important;background:transparent!important}" +
    "[data-gj-root]{padding:24px}[data-gj-root]>*{margin:0!important;border:0!important;border-radius:0!important;background:transparent!important}</style>";

  async function widget(el: Element): Promise<JSONContent> {
    const clone = el.cloneNode(true) as Element;
    for (const img of clone.querySelectorAll("img")) {
      const url = await imageUrl(img.getAttribute("src"));
      if (url) img.setAttribute("src", url);
      else img.remove();
    }
    const name = (el.querySelector("h1,h2,h3,h4,h5,h6")?.textContent ?? "").trim().slice(0, 80);
    const html = `${links}${styles}${frameReset}${shim}<div data-gj-root>${clone.outerHTML}</div>${scripts}`;
    return {
      type: "interactive",
      attrs: { html, name: name || "Componente importado", componentId: null, width: "column", height: "auto", align: "center", caption: "", showReset: true },
    };
  }

  function inline(node: Node, marks: Mark[] = []): JSONContent[] {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node.textContent ?? "").replace(/\s+/g, " ");
      return text ? [{ type: "text", text, ...(marks.length ? { marks } : {}) }] : [];
    }
    if (!(node instanceof Element)) return [];
    const tag = node.tagName;
    if (tag === "BR") return [{ type: "hardBreak" }];
    if (tag === "SCRIPT" || tag === "STYLE") return [];
    const add = (m: Mark) => (marks.some((x) => x.type === m.type) ? marks : [...marks, m]);
    let next = marks;
    if (tag === "STRONG" || tag === "B") next = add({ type: "bold" });
    else if (tag === "EM" || tag === "I") next = add({ type: "italic" });
    else if (tag === "CODE" || tag === "KBD") next = add({ type: "code" });
    else if (tag === "S" || tag === "DEL") next = add({ type: "strike" });
    else if (tag === "U") next = add({ type: "underline" });
    else if (tag === "MARK") next = add({ type: "highlight" });
    else if (tag === "A") {
      const href = node.getAttribute("href") ?? "";
      if (/^(https?:|mailto:)/i.test(href)) next = add({ type: "link", attrs: { href } });
    }
    return [...node.childNodes].flatMap((c) => inline(c, next));
  }

  /** Junta texto vizinho com as mesmas marcas e corta espaços nas pontas do parágrafo. */
  function tidy(nodes: JSONContent[]): JSONContent[] {
    const out: JSONContent[] = [];
    for (const n of nodes) {
      const prev = out[out.length - 1];
      if (prev?.type === "text" && n.type === "text" && JSON.stringify(prev.marks) === JSON.stringify(n.marks)) prev.text += n.text!;
      else out.push({ ...n });
    }
    const first = out[0];
    if (first?.type === "text") first.text = first.text!.trimStart();
    const last = out[out.length - 1];
    if (last?.type === "text") last.text = last.text!.trimEnd();
    return out.filter((n) => n.type !== "text" || n.text);
  }

  const paragraph = (el: Node): JSONContent | null => {
    const content = tidy(inline(el));
    return content.length ? { type: "paragraph", content } : null;
  };

  const isInlineOnly = (el: Element) =>
    [...el.childNodes].every(
      (c) =>
        c.nodeType === Node.TEXT_NODE ||
        (c instanceof Element && /^(STRONG|B|EM|I|CODE|KBD|S|DEL|U|MARK|A|SPAN|BR|SMALL|SUB|SUP)$/.test(c.tagName)),
    );

  async function image(img: HTMLImageElement | null, caption: string): Promise<JSONContent | null> {
    const src = await imageUrl(img?.getAttribute("src") ?? null);
    if (!src) return null;
    return { type: "image", attrs: { src, alt: img?.getAttribute("alt") ?? "", caption: caption.slice(0, 300), rounded: true, width: "column" } };
  }

  async function cellContent(cell: Element): Promise<JSONContent[]> {
    const blocks = await children(cell);
    return blocks.length ? blocks : [{ type: "paragraph" }];
  }

  async function block(el: Element): Promise<JSONContent[]> {
    const tag = el.tagName;
    if (el.matches(WIDGET_SELECTOR)) return [await widget(el)];

    switch (tag) {
      case "SCRIPT":
      case "STYLE":
      case "NOSCRIPT":
      case "TEMPLATE":
        return [];
      case "H1":
      case "H2":
      case "H3":
      case "H4":
      case "H5":
      case "H6": {
        const level = Math.min(4, Math.max(2, Number(tag[1]) + (tag === "H1" ? 1 : 0)));
        const content = tidy(inline(el));
        return content.length ? [{ type: "heading", attrs: { level }, content }] : [];
      }
      case "P": {
        const img = el.querySelector("img");
        if (img && !el.textContent?.trim()) {
          const node = await image(img, img.getAttribute("alt") ?? "");
          return node ? [node] : [];
        }
        const p = paragraph(el);
        return p ? [p] : [];
      }
      case "UL":
      case "OL": {
        const items: JSONContent[] = [];
        for (const li of el.children) {
          if (li.tagName !== "LI") continue;
          const content = await children(li);
          items.push({ type: "listItem", content: content.length ? content : [{ type: "paragraph" }] });
        }
        if (!items.length) return [];
        const start = Number(el.getAttribute("start") ?? 1);
        return [tag === "UL" ? { type: "bulletList", content: items } : { type: "orderedList", attrs: { start }, content: items }];
      }
      case "BLOCKQUOTE": {
        const content = await children(el);
        return content.length ? [{ type: "blockquote", content }] : [];
      }
      case "PRE": {
        const code = el.querySelector("code") ?? el;
        const cls = `${code.className} ${el.className}`;
        const language = /(?:language|lang)-([\w+#-]+)/.exec(cls)?.[1] ?? "plaintext";
        const text = (code.textContent ?? "").replace(/\n$/, "");
        return [{ type: "codeBlock", attrs: { language }, content: text ? [{ type: "text", text }] : [] }];
      }
      case "HR":
        return [{ type: "horizontalRule" }];
      case "IMG": {
        const node = await image(el as HTMLImageElement, el.getAttribute("alt") ?? "");
        return node ? [node] : [];
      }
      case "FIGURE": {
        const img = el.querySelector("img");
        const caption = el.querySelector("figcaption")?.textContent?.trim() ?? "";
        if (img) {
          const node = await image(img, caption);
          return node ? [node] : [];
        }
        return children(el);
      }
      case "IFRAME": {
        const id = /(?:youtube(?:-nocookie)?\.com\/embed\/|youtu\.be\/)([\w-]{11})/.exec(el.getAttribute("src") ?? "")?.[1];
        return id ? [{ type: "youtube", attrs: { videoId: id, title: el.getAttribute("title") ?? "", start: 0 } }] : [];
      }
      case "TABLE": {
        const rows: JSONContent[] = [];
        for (const tr of el.querySelectorAll("tr")) {
          const cells: JSONContent[] = [];
          for (const cell of tr.children) {
            if (cell.tagName !== "TD" && cell.tagName !== "TH") continue;
            cells.push({
              type: cell.tagName === "TH" ? "tableHeader" : "tableCell",
              attrs: { colspan: Number(cell.getAttribute("colspan") ?? 1), rowspan: Number(cell.getAttribute("rowspan") ?? 1) },
              content: await cellContent(cell),
            });
          }
          if (cells.length) rows.push({ type: "tableRow", content: cells });
        }
        return rows.length ? [{ type: "table", content: rows }] : [];
      }
      case "ASIDE":
        return [await callout(el)];
    }

    if (el.matches(".note, .callout, .tip, .warning, .alert, [data-callout]")) return [await callout(el)];

    // Bloco com controles mas sem marcação de widget: também vira interativo.
    if (el.querySelector("input, button, select, textarea, canvas") || INTERACTIVE_TAGS.has(tag)) return [await widget(el)];

    // Divs e afins: só texto → parágrafo; senão, desce nos filhos.
    if (isInlineOnly(el)) {
      const p = paragraph(el);
      return p ? [p] : [];
    }
    return children(el);
  }

  async function callout(el: Element): Promise<JSONContent> {
    const blocks = await children(el);
    const paragraphs = blocks.flatMap((b) => (b.type === "paragraph" ? [b] : b.content?.length ? [{ type: "paragraph", content: tidy(textOf(b)) }] : []));
    const tone = el.matches(".warning, .alert, [data-tone=warning]") ? "warning" : el.matches(".tip, [data-tone=tip]") ? "tip" : "info";
    return { type: "callout", attrs: { tone }, content: paragraphs.length ? paragraphs : [{ type: "paragraph" }] };
  }

  const textOf = (n: JSONContent): JSONContent[] =>
    n.type === "text" ? [n] : (n.content ?? []).flatMap((c, i, all) => [...textOf(c), ...(i < all.length - 1 && c.type !== "text" ? [{ type: "text", text: " " }] : [])]);

  /** Converte os filhos de um elemento; texto solto entre blocos vira parágrafo. */
  async function children(el: Element): Promise<JSONContent[]> {
    if (isInlineOnly(el)) {
      const p = paragraph(el);
      return p ? [p] : [];
    }
    const out: JSONContent[] = [];
    let loose: Node[] = [];
    const flush = () => {
      if (!loose.length) return;
      const frag = document.createElement("div");
      loose.forEach((n) => frag.appendChild(n.cloneNode(true)));
      const p = paragraph(frag);
      if (p) out.push(p);
      loose = [];
    };
    for (const c of el.childNodes) {
      if (c instanceof Element && (BLOCK_TAGS.test(c.tagName) || !isInlineOnly(c))) {
        flush();
        out.push(...(await block(c)));
      } else loose.push(c);
    }
    flush();
    return out;
  }

  const content = await children(root);
  if (!content.length) throw new Error("Não encontrei conteúdo no HTML.");

  const firstImage = content.find((n) => n.type === "image");
  return {
    title: title.slice(0, 200),
    description: description.slice(0, 300),
    content: { type: "doc", content },
    coverUrl: (firstImage?.attrs?.src as string | undefined) ?? null,
  };
}
