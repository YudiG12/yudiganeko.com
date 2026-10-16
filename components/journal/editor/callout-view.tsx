"use client";

import { NodeViewContent, NodeViewWrapper, type NodeViewProps } from "@tiptap/react";

const TONES = {
  info: { label: "info", icon: "i", wrap: "bg-[#f3f7fc] ring-[#3767a8]/25", dot: "bg-[#3767a8]" },
  tip: { label: "dica", icon: "✓", wrap: "bg-[#f2f8f4] ring-[#2f8a5b]/25", dot: "bg-[#2f8a5b]" },
  warning: { label: "atenção", icon: "!", wrap: "bg-[#fdf7ec] ring-[#b87a12]/30", dot: "bg-[#b87a12]" },
} as const;

export default function CalloutView({ node, updateAttributes }: NodeViewProps) {
  const tone = (node.attrs.tone as keyof typeof TONES) ?? "info";
  const t = TONES[tone] ?? TONES.info;
  const order = Object.keys(TONES) as (keyof typeof TONES)[];
  return (
    <NodeViewWrapper className={`group relative flex gap-3.5 rounded-2xl px-5 py-4 ring-1 ${t.wrap}`}>
      <button
        type="button"
        contentEditable={false}
        title={`Tipo: ${t.label} (clique para trocar)`}
        onClick={() => updateAttributes({ tone: order[(order.indexOf(tone) + 1) % order.length] })}
        className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${t.dot} font-mono text-[11px] font-bold text-white transition-transform active:scale-90`}
      >
        {t.icon}
      </button>
      <NodeViewContent className="min-w-0 flex-1 text-[17px] leading-7 [&_p]:m-0 [&>div]:flex [&>div]:flex-col [&>div]:gap-2" />
      <span contentEditable={false} className="pointer-events-none absolute right-3 top-2 font-mono text-[10px] text-blue-fantastic/40 opacity-0 transition-opacity group-hover:opacity-100">
        {t.label}
      </span>
    </NodeViewWrapper>
  );
}
