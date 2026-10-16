"use client";

import type { Editor, Range } from "@tiptap/core";
import type { ReactNode } from "react";
import type { InteractiveComponent } from "@/lib/journal/types";
import { DIAGRAM_SAMPLE } from "./diagram-view";

export type SlashItem = {
  id: string;
  group: "TEXTO" | "TÉCNICO" | "MÍDIA" | "DA SUA BIBLIOTECA";
  label: string;
  hint?: string;
  shortcut?: string;
  keywords: string;
  icon: ReactNode;
  accent?: boolean;
  description: string;
  run: (editor: Editor, range: Range) => void;
};

const box = (child: ReactNode, accent = false) => (
  <span
    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] ${
      accent ? "bg-truffle-trouble text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]" : "text-blue-fantastic shadow-[inset_0_0_0_1px_rgba(201,193,177,0.8)]"
    }`}
  >
    {child}
  </span>
);
const svg = (d: ReactNode) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {d}
  </svg>
);

export function buildSlashItems(opts: {
  onImage: (editor: Editor) => void;
  onLibrary: (editor: Editor) => void;
  components: InteractiveComponent[];
}): SlashItem[] {
  const base: SlashItem[] = [
    {
      id: "text", group: "TEXTO", label: "Texto", keywords: "texto paragrafo paragraph", icon: box(<span className="font-sans text-[13px] font-semibold">Aa</span>),
      description: "Um parágrafo comum.", run: (e, r) => e.chain().focus().deleteRange(r).setParagraph().run(),
    },
    {
      id: "h2", group: "TEXTO", label: "Título", shortcut: "##", keywords: "titulo heading h2 secao", icon: box(<span className="font-sans text-xs font-bold">H2</span>),
      description: "Título de seção. Aparece no índice lateral.", run: (e, r) => e.chain().focus().deleteRange(r).setHeading({ level: 2 }).run(),
    },
    {
      id: "h3", group: "TEXTO", label: "Subtítulo", shortcut: "###", keywords: "subtitulo heading h3", icon: box(<span className="font-sans text-xs font-bold">H3</span>),
      description: "Subdivide uma seção.", run: (e, r) => e.chain().focus().deleteRange(r).setHeading({ level: 3 }).run(),
    },
    {
      id: "h4", group: "TEXTO", label: "Título menor", shortcut: "####", keywords: "h4 titulo menor", icon: box(<span className="font-sans text-xs font-bold">H4</span>),
      description: "Um título pequeno, sem entrar no índice principal.", run: (e, r) => e.chain().focus().deleteRange(r).setHeading({ level: 4 }).run(),
    },
    {
      id: "ul", group: "TEXTO", label: "Lista", shortcut: "-", keywords: "lista bullet marcadores", icon: box(svg(<path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" />)),
      description: "Lista com marcadores.", run: (e, r) => e.chain().focus().deleteRange(r).toggleBulletList().run(),
    },
    {
      id: "ol", group: "TEXTO", label: "Lista numerada", shortcut: "1.", keywords: "lista numerada ordered", icon: box(<span className="font-mono text-[11px] font-semibold">1.</span>),
      description: "Passo a passo numerado.", run: (e, r) => e.chain().focus().deleteRange(r).toggleOrderedList().run(),
    },
    {
      id: "quote", group: "TEXTO", label: "Citação", shortcut: ">", keywords: "citacao quote blockquote", icon: box(<span className="font-sans text-lg leading-none">“</span>),
      description: "Destaca uma frase ou citação.", run: (e, r) => e.chain().focus().deleteRange(r).toggleBlockquote().run(),
    },
    {
      id: "callout", group: "TEXTO", label: "Destaque", shortcut: "!!", keywords: "destaque callout aviso dica nota", icon: box(<span className="font-mono text-[13px] font-bold text-[#b87a12]">!</span>),
      description: "Caixa de informação, dica ou atenção. Clique no ícone para trocar o tipo.",
      run: (e, r) => e.chain().focus().deleteRange(r).insertContent({ type: "callout", attrs: { tone: "info" }, content: [{ type: "paragraph" }] }).run(),
    },
    {
      id: "code", group: "TÉCNICO", label: "Código", shortcut: "```", keywords: "codigo code bloco snippet", icon: box(svg(<path d="m16 18 6-6-6-6M8 6l-6 6 6 6" />)),
      description: "Bloco de código com syntax highlighting.", run: (e, r) => e.chain().focus().deleteRange(r).toggleCodeBlock().run(),
    },
    {
      id: "table", group: "TÉCNICO", label: "Tabela", keywords: "tabela table", icon: box(svg(<><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18M9 10v10" /></>)),
      description: "Tabela 3×3 com cabeçalho.", run: (e, r) => e.chain().focus().deleteRange(r).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
    },
    {
      id: "diagram", group: "TÉCNICO", label: "Diagrama", hint: "mermaid", keywords: "diagrama fluxo mermaid flowchart grafico", icon: box(<span className="font-mono text-[11px]">◇→</span>),
      description: "Fluxogramas e sequências escritos em texto (Mermaid).",
      run: (e, r) => e.chain().focus().deleteRange(r).insertContent({ type: "diagram", attrs: { code: DIAGRAM_SAMPLE } }).run(),
    },
    {
      id: "interactive", group: "TÉCNICO", label: "Interativo", hint: "HTML, CSS e JS", keywords: "interativo html componente simulacao iframe js", accent: true,
      icon: box(svg(<><path d="m9 9 5 12 1.8-5.2L21 14z" /><path d="M7.2 2.2 8 5.1M5.1 8l-2.9-.8M14 4.1 12 6M6 12l-1.9 2" /></>), true),
      description: "Cole um HTML gerado no ChatGPT ou no Claude e veja funcionando aqui, do jeito que o leitor vai ver.",
      run: (e, r) => e.chain().focus().deleteRange(r).insertContent({ type: "interactive" }).run(),
    },
    {
      id: "divider", group: "TÉCNICO", label: "Divisor", shortcut: "---", keywords: "divisor separador hr linha", icon: box(<span className="font-mono text-[11px]">···</span>),
      description: "Separa partes do texto.", run: (e, r) => e.chain().focus().deleteRange(r).setHorizontalRule().run(),
    },
    {
      id: "image", group: "MÍDIA", label: "Imagem", hint: "cole ou arraste", keywords: "imagem foto image upload", icon: box(svg(<><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" /></>)),
      description: "Envie uma imagem. Por padrão ela tem cantos arredondados (dá para desligar).",
      run: (e, r) => {
        e.chain().focus().deleteRange(r).run();
        opts.onImage(e);
      },
    },
    {
      id: "youtube", group: "MÍDIA", label: "Vídeo do YouTube", keywords: "youtube video", icon: <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-[#FF0033]"><svg width="13" height="13" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z" /></svg></span>,
      description: "Card de vídeo que só carrega o player quando o leitor clica.",
      run: (e, r) => e.chain().focus().deleteRange(r).insertContent({ type: "youtube" }).run(),
    },
  ];
  const library: SlashItem[] = opts.components.slice(0, 6).map((c) => ({
    id: `lib-${c.id}`,
    group: "DA SUA BIBLIOTECA",
    label: c.name,
    hint: c.usage ? `usado em ${c.usage} ${c.usage === 1 ? "artigo" : "artigos"}` : "na biblioteca",
    keywords: `biblioteca componente interativo ${c.name.toLowerCase()}`,
    icon: box(svg(<path d="m9 9 5 12 1.8-5.2L21 14z" />)),
    description: `Componente salvo: ${c.name}.`,
    run: (e, r) =>
      e.chain().focus().deleteRange(r).insertContent({ type: "interactive", attrs: { html: c.html, name: c.name, componentId: c.id } }).run(),
  }));
  return [...base, ...library];
}

export function filterItems(items: SlashItem[], query: string) {
  const q = query
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
  if (!q) return items;
  return items.filter((i) =>
    `${i.label} ${i.keywords}`
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .includes(q),
  );
}
