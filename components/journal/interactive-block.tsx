"use client";

import { useState } from "react";
import { widthClass } from "@/lib/journal/layout";
import InteractiveFrame from "./interactive-frame";

export type InteractiveAttrs = {
  html: string;
  name?: string;
  componentId?: string | null;
  width?: "column" | "wide" | "full";
  height?: "auto" | number;
  align?: "left" | "center" | "right";
  caption?: string;
  showReset?: boolean;
};


/** Como o leitor vê um componente interativo: sem nenhum controle técnico. */
export default function InteractiveBlock({ attrs }: { attrs: InteractiveAttrs }) {
  const [reset, setReset] = useState(0);
  const width = attrs.width ?? "wide";
  const align = attrs.align ?? "center";
  const caption = attrs.caption?.trim();
  return (
    <figure
      className={`gj-breakout flex flex-col gap-3.5 ${
        align === "left" ? "items-start" : align === "right" ? "items-end" : "items-center"
      }`}
    >
      <div
        className={`${widthClass[width]} relative overflow-hidden rounded-[20px] bg-[#fcfbf8] ring-1 ring-oatmeal/55`}
      >
        <InteractiveFrame
          html={attrs.html}
          height={attrs.height ?? "auto"}
          title={attrs.name || caption || "Componente interativo"}
          resetKey={reset}
        />
        {attrs.showReset !== false && (
          <button
            type="button"
            onClick={() => setReset((n) => n + 1)}
            className="group absolute right-3.5 top-3.5 flex items-center gap-1.5 rounded-full px-2.5 py-1.5 font-mono text-[11px] text-blue-fantastic/70 transition hover:bg-white hover:text-blue-fantastic hover:shadow-sm active:scale-95"
            aria-label="Reiniciar interação"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-transform duration-500 group-active:-rotate-180"
            >
              <path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5" />
            </svg>
            reiniciar
          </button>
        )}
      </div>
      {caption && (
        <figcaption className="max-w-[720px] px-2 text-center font-mono text-[13px] leading-5 text-blue-fantastic/60">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
