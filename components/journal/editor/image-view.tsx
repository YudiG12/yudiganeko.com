"use client";

import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { useState } from "react";
import { Segmented, Toggle } from "../admin/ui";
import { widthClass } from "@/lib/journal/layout";
import { useEditorCtx } from "./context";
import { pickImage, uploadImage } from "./upload";

export default function ImageView({ node, updateAttributes, selected, deleteNode }: NodeViewProps) {
  const ctx = useEditorCtx();
  const [busy, setBusy] = useState(false);
  const { src, caption, rounded, width, alt } = node.attrs as {
    src: string;
    caption: string;
    rounded: boolean;
    width: "column" | "wide" | "full";
    alt: string;
  };

  async function replace() {
    const file = await pickImage();
    if (!file) return;
    setBusy(true);
    try {
      updateAttributes({ src: await uploadImage(file, ctx.articleId) });
    } catch (e) {
      ctx.toast(e instanceof Error ? e.message : "Falha no upload", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <NodeViewWrapper className="gj-breakout relative flex flex-col items-center gap-3 pt-14" contentEditable={false} data-drag-handle>
      <div
        className={`absolute left-1/2 top-0 z-20 flex -translate-x-1/2 items-center gap-0.5 rounded-xl bg-white p-1 shadow-[0_0_0_1px_rgba(201,193,177,0.7),0_12px_24px_-10px_rgba(44,59,77,0.3)] transition-all duration-200 ${
          selected ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-1 opacity-0"
        }`}
      >
        <Segmented
          value={width ?? "column"}
          onChange={(v) => updateAttributes({ width: v })}
          options={[
            { value: "column", label: "coluna" },
            { value: "wide", label: "larga" },
            { value: "full", label: "tela cheia" },
          ]}
        />
        <span className="mx-1 h-5 w-px bg-oatmeal/70" />
        <label className="flex h-8 cursor-pointer items-center gap-2 px-2.5">
          <span className="font-mono text-xs">cantos arredondados</span>
          <Toggle checked={rounded !== false} onChange={(v) => updateAttributes({ rounded: v })} label="Cantos arredondados" />
        </label>
        <span className="mx-1 h-5 w-px bg-oatmeal/70" />
        <button type="button" onClick={replace} title="Trocar imagem" className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-palladian">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2C3B4D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M8 16H3v5" />
          </svg>
        </button>
        <button type="button" onClick={() => deleteNode()} title="Remover" className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[#cf4238]/[0.08]">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#CF4238" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
          </svg>
        </button>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt ?? ""}
        draggable={false}
        className={`${widthClass[width ?? "column"]} h-auto transition-[max-width,border-radius,box-shadow,opacity] duration-300 ease-[cubic-bezier(.34,1.56,.64,1)] ${
          rounded !== false ? "rounded-2xl" : "rounded-none"
        } ${selected ? "shadow-[0_0_0_2px_#fff,0_0_0_4px_#a35139]" : ""} ${busy ? "opacity-50" : ""}`}
      />
      <input
        value={caption ?? ""}
        onChange={(e) => updateAttributes({ caption: e.target.value.slice(0, 300) })}
        onKeyDown={(e) => e.stopPropagation()}
        placeholder="Legenda (opcional)"
        className="w-full max-w-[720px] bg-transparent px-2 text-center font-mono text-[13px] text-blue-fantastic/60 outline-none placeholder:text-blue-fantastic/30 focus:text-blue-fantastic"
      />
    </NodeViewWrapper>
  );
}
