"use client";

import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { useEffect, useState } from "react";
import MermaidDiagram from "../mermaid-diagram";

export const DIAGRAM_SAMPLE = `flowchart LR
  E[Eletricidade] --> T[Transistor]
  T --> B[Bits]
  B --> P[Portas lógicas]
  P --> O[Operações]
  O --> S[Programas]`;

export default function DiagramView({ node, updateAttributes, selected }: NodeViewProps) {
  const { code, caption } = node.attrs as { code: string; caption: string };
  const [draft, setDraft] = useState(code);
  const [live, setLive] = useState(code);
  useEffect(() => {
    const t = setTimeout(() => {
      setLive(draft);
      updateAttributes({ code: draft });
    }, 400);
    return () => clearTimeout(t);
  }, [draft, updateAttributes]);
  return (
    <NodeViewWrapper contentEditable={false} className="flex flex-col gap-3">
      <MermaidDiagram code={live} />
      {selected && (
        <div className="gj-rise flex flex-col overflow-hidden rounded-2xl bg-[#1f2733]">
          <div className="flex h-8 items-center justify-between border-b border-white/[0.06] px-3.5 font-mono text-[11px] text-palladian/50">
            <span>diagrama · sintaxe Mermaid</span>
            <a href="https://mermaid.js.org/intro/" target="_blank" rel="noreferrer" className="hover:text-palladian">
              referência ↗
            </a>
          </div>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            rows={Math.min(14, Math.max(4, draft.split("\n").length + 1))}
            spellCheck={false}
            className="resize-none bg-transparent px-4 py-3 font-mono text-[12.5px] leading-[21px] text-[#d8d2c4] outline-none"
          />
        </div>
      )}
      <input
        value={caption ?? ""}
        onKeyDown={(e) => e.stopPropagation()}
        onChange={(e) => updateAttributes({ caption: e.target.value.slice(0, 300) })}
        placeholder="Legenda (opcional) · clique no diagrama para editar"
        className="bg-transparent px-2 text-center font-mono text-[13px] text-blue-fantastic/60 outline-none placeholder:text-blue-fantastic/30"
      />
    </NodeViewWrapper>
  );
}
