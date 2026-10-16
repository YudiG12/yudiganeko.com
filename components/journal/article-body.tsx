import { Fragment, type ReactNode } from "react";
import { headingIds, nodeText } from "@/lib/journal/content";
import type { JSONContent } from "@/lib/journal/types";
import CodeBlock from "./code-block";
import { widthClass } from "@/lib/journal/layout";
import InteractiveBlock, { type InteractiveAttrs } from "./interactive-block";
import MermaidDiagram from "./mermaid-diagram";
import YouTubeEmbed from "./youtube-embed";

/**
 * Renderiza o documento do editor (JSON do Tiptap) com a tipografia do Journal.
 * Não depende do Tiptap: é usado nas páginas públicas e no modo "Visualizar" do editor.
 */

type Mark = NonNullable<JSONContent["marks"]>[number];

function safeHref(href: unknown) {
  const h = String(href ?? "");
  if (/^(https?:|mailto:|\/|#)/i.test(h)) return h;
  return "#";
}

function applyMarks(text: ReactNode, marks: Mark[] | undefined, key: string) {
  let out = text;
  for (const m of marks ?? []) {
    switch (m.type) {
      case "bold":
        out = <strong className="font-semibold text-blue-fantastic">{out}</strong>;
        break;
      case "italic":
        out = <em>{out}</em>;
        break;
      case "underline":
        out = <u className="underline-offset-4">{out}</u>;
        break;
      case "strike":
        out = <s>{out}</s>;
        break;
      case "code":
        out = (
          <code className="rounded-md bg-palladian px-1.5 py-0.5 font-mono text-[0.86em] text-truffle-trouble ring-1 ring-oatmeal/50">
            {out}
          </code>
        );
        break;
      case "highlight":
        out = <mark className="rounded-[3px] bg-[#ffb162]/30 px-0.5 text-inherit">{out}</mark>;
        break;
      case "link": {
        const href = safeHref(m.attrs?.href);
        const external = /^https?:/i.test(href) && !href.includes("yudiganeko.com");
        out = (
          <a
            href={href}
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="font-medium text-truffle-trouble underline decoration-truffle-trouble/35 underline-offset-4 transition-colors hover:decoration-truffle-trouble"
          >
            {out}
          </a>
        );
        break;
      }
    }
  }
  return <Fragment key={key}>{out}</Fragment>;
}

function inline(nodes: JSONContent[] | undefined, keyPrefix: string): ReactNode[] {
  return (nodes ?? []).map((n, i) => {
    const key = `${keyPrefix}-${i}`;
    if (n.type === "text") return applyMarks(n.text ?? "", n.marks, key);
    if (n.type === "hardBreak") return <br key={key} />;
    return <Fragment key={key}>{inline(n.content, key)}</Fragment>;
  });
}

const CALLOUTS = {
  info: { icon: "i", ring: "ring-[#3767a8]/25", bg: "bg-[#f3f7fc]", dot: "bg-[#3767a8]" },
  tip: { icon: "✓", ring: "ring-[#2f8a5b]/25", bg: "bg-[#f2f8f4]", dot: "bg-[#2f8a5b]" },
  warning: { icon: "!", ring: "ring-[#b87a12]/30", bg: "bg-[#fdf7ec]", dot: "bg-[#b87a12]" },
} as const;

function Block({ node, k, ids }: { node: JSONContent; k: string; ids: Map<JSONContent, string> }): ReactNode {
  const children = () => (node.content ?? []).map((c, i) => <Block key={`${k}-${i}`} node={c} k={`${k}-${i}`} ids={ids} />);
  switch (node.type) {
    case "paragraph":
      if (!node.content?.length) return <p className="h-2" aria-hidden />;
      return <p>{inline(node.content, k)}</p>;
    case "heading": {
      const level = Math.min(4, Math.max(2, Number(node.attrs?.level ?? 2)));
      const id = ids.get(node);
      const cls =
        level === 2
          ? "pt-6 text-[26px] sm:text-[28px] leading-9 font-bold tracking-[-0.02em]"
          : level === 3
            ? "pt-3 text-[21px] sm:text-[22px] leading-8 font-semibold tracking-[-0.015em]"
            : "pt-2 text-lg leading-7 font-semibold";
      const Tag = `h${level}` as "h2" | "h3" | "h4";
      return (
        <Tag id={id} className={`group scroll-mt-24 text-blue-fantastic ${cls}`}>
          {inline(node.content, k)}
          {id && (
            <a
              href={`#${id}`}
              aria-label="Link para esta seção"
              className="ml-2 font-mono text-[0.7em] font-normal text-oatmeal opacity-0 transition-opacity group-hover:opacity-100"
            >
              #
            </a>
          )}
        </Tag>
      );
    }
    case "bulletList":
      return <ul className="flex list-disc flex-col gap-2 pl-6 marker:text-truffle-trouble/70">{children()}</ul>;
    case "orderedList":
      return (
        <ol
          start={Number(node.attrs?.start ?? 1)}
          className="flex list-decimal flex-col gap-2 pl-6 marker:font-mono marker:text-[0.85em] marker:text-truffle-trouble/80"
        >
          {children()}
        </ol>
      );
    case "listItem":
      return <li className="pl-1 [&>p]:m-0 [&>ul]:mt-2 [&>ol]:mt-2">{children()}</li>;
    case "blockquote":
      return (
        <blockquote className="flex flex-col gap-3 border-l-2 border-truffle-trouble/50 py-1 pl-5 text-[19px] leading-8 text-blue-fantastic/80 italic">
          {children()}
        </blockquote>
      );
    case "horizontalRule":
      return (
        <div className="flex justify-center py-4" aria-hidden>
          <span className="font-mono text-sm tracking-[0.6em] text-oatmeal">···</span>
        </div>
      );
    case "codeBlock":
      return <CodeBlock code={nodeText(node)} language={(node.attrs?.language as string) ?? null} />;
    case "callout": {
      const tone = CALLOUTS[(node.attrs?.tone as keyof typeof CALLOUTS) ?? "info"] ?? CALLOUTS.info;
      return (
        <aside className={`flex gap-3.5 rounded-2xl ${tone.bg} px-5 py-4 ring-1 ${tone.ring}`}>
          <span
            className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${tone.dot} font-mono text-[11px] font-bold text-white`}
          >
            {tone.icon}
          </span>
          <div className="flex min-w-0 flex-col gap-2 text-[17px] leading-7 [&>p]:m-0">{children()}</div>
        </aside>
      );
    }
    case "image": {
      const src = String(node.attrs?.src ?? "");
      if (!/^https:\/\//.test(src)) return null;
      const width = (node.attrs?.width as keyof typeof widthClass) ?? "column";
      const rounded = node.attrs?.rounded !== false;
      const caption = String(node.attrs?.caption ?? "").trim();
      return (
        <figure className="gj-breakout flex flex-col items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={String(node.attrs?.alt ?? caption ?? "")}
            loading="lazy"
            decoding="async"
            className={`${widthClass[width] ?? widthClass.column} h-auto ${rounded ? "rounded-2xl" : "rounded-none"}`}
          />
          {caption && (
            <figcaption className="max-w-[720px] px-2 text-center font-mono text-[13px] leading-5 text-blue-fantastic/60">
              {caption}
            </figcaption>
          )}
        </figure>
      );
    }
    case "youtube": {
      const id = String(node.attrs?.videoId ?? "");
      if (!/^[\w-]{11}$/.test(id)) return null;
      return (
        <YouTubeEmbed videoId={id} title={(node.attrs?.title as string) || undefined} start={Number(node.attrs?.start ?? 0)} />
      );
    }
    case "diagram": {
      const caption = String(node.attrs?.caption ?? "").trim();
      return (
        <figure className="flex flex-col gap-3">
          <MermaidDiagram code={String(node.attrs?.code ?? "")} />
          {caption && (
            <figcaption className="text-center font-mono text-[13px] leading-5 text-blue-fantastic/60">{caption}</figcaption>
          )}
        </figure>
      );
    }
    case "interactive": {
      const attrs = node.attrs as unknown as InteractiveAttrs;
      if (!attrs?.html) return null;
      return <InteractiveBlock attrs={attrs} />;
    }
    case "table":
      return (
        <div className="overflow-x-auto rounded-2xl ring-1 ring-oatmeal/60">
          <table className="w-full border-collapse text-left text-[15px] leading-6">
            <tbody>{children()}</tbody>
          </table>
        </div>
      );
    case "tableRow":
      return <tr className="border-b border-oatmeal/40 last:border-0">{children()}</tr>;
    case "tableHeader":
      return (
        <th className="bg-palladian px-4 py-2.5 font-mono text-xs font-semibold tracking-wide text-blue-fantastic [&>p]:m-0">
          {children()}
        </th>
      );
    case "tableCell":
      return <td className="px-4 py-2.5 align-top [&>p]:m-0">{children()}</td>;
    default:
      return node.content ? <>{children()}</> : null;
  }
}

export default function ArticleBody({ doc }: { doc: JSONContent }) {
  const toc = headingIds(doc);
  const ids = new Map<JSONContent, string>();
  let i = 0;
  for (const n of doc.content ?? []) {
    if (n.type === "heading" && nodeText(n).trim()) ids.set(n, toc[i++]?.id ?? "");
  }
  return (
    <div className="gj-prose flex flex-col gap-[22px] font-sans text-[17px] leading-[29px] text-blue-fantastic sm:text-[18px] sm:leading-[31px]">
      {(doc.content ?? []).map((n, idx) => (
        <Block key={idx} node={n} k={String(idx)} ids={ids} />
      ))}
    </div>
  );
}
