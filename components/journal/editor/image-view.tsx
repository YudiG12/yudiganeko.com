"use client";

import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { useRef, useState } from "react";
import { Segmented, Toggle } from "../admin/ui";
import { widthClass } from "@/lib/journal/layout";
import { useEditorCtx } from "./context";
import { pickImage, uploadImage } from "./upload";

const MIN_SIZE = 160;
const MAX_SIZE = 1200;

export default function ImageView({ node, updateAttributes, selected, deleteNode }: NodeViewProps) {
  const ctx = useEditorCtx();
  const [busy, setBusy] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  // Largura ao vivo durante o arraste; só vira atributo (e entra no histórico) ao soltar.
  const [dragSize, setDragSize] = useState<number | null>(null);
  const { src, caption, rounded, width, alt, size } = node.attrs as {
    src: string;
    caption: string;
    rounded: boolean;
    width: "column" | "wide" | "full";
    alt: string;
    size: number | null;
  };
  const shownSize = dragSize ?? size;

  function startResize(e: React.PointerEvent<HTMLSpanElement>, side: 1 | -1) {
    const frame = frameRef.current;
    if (!frame) return;
    e.preventDefault();
    e.stopPropagation();
    const handle = e.currentTarget;
    handle.setPointerCapture(e.pointerId);
    const startX = e.clientX;
    const startW = frame.getBoundingClientRect().width;
    const max = Math.min(MAX_SIZE, window.innerWidth - 32);
    let next = startW;
    // A imagem é centralizada, então cada px da alça vale 2px de largura.
    const onMove = (ev: PointerEvent) => {
      next = Math.round(Math.min(max, Math.max(MIN_SIZE, startW + (ev.clientX - startX) * 2 * side)));
      setDragSize(next);
    };
    const onUp = () => {
      handle.removeEventListener("pointermove", onMove);
      handle.removeEventListener("pointerup", onUp);
      handle.removeEventListener("pointercancel", onUp);
      setDragSize(null);
      if (next !== startW) updateAttributes({ size: next });
    };
    handle.addEventListener("pointermove", onMove);
    handle.addEventListener("pointerup", onUp);
    handle.addEventListener("pointercancel", onUp);
  }

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
          onChange={(v) => updateAttributes({ width: v, size: null })}
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
      <div
        ref={frameRef}
        style={shownSize ? { maxWidth: shownSize } : undefined}
        className={`group/img relative ${widthClass[width ?? "column"]} ${
          dragSize ? "" : "transition-[max-width] duration-300 ease-[cubic-bezier(.34,1.56,.64,1)]"
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt ?? ""}
          draggable={false}
          className={`block h-auto w-full transition-[border-radius,box-shadow,opacity] duration-300 ease-[cubic-bezier(.34,1.56,.64,1)] ${
            rounded !== false ? "rounded-2xl" : "rounded-none"
          } ${selected || dragSize ? "shadow-[0_0_0_2px_#fff,0_0_0_4px_#a35139]" : ""} ${busy ? "opacity-50" : ""}`}
        />
        {([-1, 1] as const).map((side) => (
          <span
            key={side}
            role="separator"
            aria-orientation="vertical"
            aria-label="Redimensionar imagem"
            title="Arraste para redimensionar · duplo clique volta ao preset"
            onPointerDown={(e) => startResize(e, side)}
            onDoubleClick={() => updateAttributes({ size: null })}
            className={`absolute top-1/2 z-10 flex h-16 w-4 -translate-y-1/2 cursor-ew-resize touch-none items-center justify-center transition-opacity duration-200 ${
              side === -1 ? "-left-2" : "-right-2"
            } ${selected || dragSize ? "opacity-100" : "opacity-0 group-hover/img:opacity-100"}`}
          >
            <span className="h-12 w-1.5 rounded-full bg-white shadow-[0_0_0_1px_rgba(44,59,77,0.25),0_4px_10px_-2px_rgba(44,59,77,0.35)]" />
          </span>
        ))}
        {dragSize && (
          <span className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-md bg-blue-fantastic/85 px-2 py-1 font-mono text-[11px] text-white">
            {dragSize}px
          </span>
        )}
      </div>
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
