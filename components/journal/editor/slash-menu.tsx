"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import InteractiveFrame from "../interactive-frame";
import type { SlashItem } from "./slash-items";

export type SlashState = { open: boolean; query: string; left: number; top: number; bottom: number };

const PREVIEW_HTML = `<style>body{margin:0;display:flex;align-items:center;justify-content:center;height:150px;font-family:system-ui}
.w{stroke:#E8892B;stroke-width:3;stroke-linecap:round;stroke-dasharray:6 6;animation:f 1s linear infinite}@keyframes f{to{stroke-dashoffset:-12}}
.l{animation:p 1.6s ease-in-out infinite}@keyframes p{50%{opacity:.55}}</style>
<svg width="200" height="96" viewBox="0 0 200 96" fill="none"><path class="w" d="M16 30h44M16 66h44"/><path d="M60 18h26a30 30 0 0 1 0 60H60z" fill="#F9F7F4" stroke="#2C3B4D" stroke-width="2"/><path class="w" d="M116 48h44"/><circle class="l" cx="178" cy="48" r="12" fill="#E8892B"/><circle cx="178" cy="48" r="18" stroke="rgba(232,137,43,.3)" stroke-width="4"/><rect x="0" y="22" width="16" height="16" rx="4" fill="#2C3B4D"/><rect x="0" y="58" width="16" height="16" rx="4" fill="#2C3B4D"/></svg>`;

export default function SlashMenu({
  state,
  items,
  selected,
  onHover,
  onPick,
  onLibrary,
}: {
  state: SlashState;
  items: SlashItem[];
  selected: number;
  onHover: (i: number) => void;
  onPick: (item: SlashItem) => void;
  onLibrary: () => void;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: state.left, top: state.bottom + 8 });
  const [wide, setWide] = useState(true);

  useLayoutEffect(() => {
    const el = panel.current;
    const w = el?.offsetWidth ?? 600;
    const h = el?.offsetHeight ?? 400;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    setWide(vw > 760);
    const left = Math.max(12, Math.min(state.left, vw - w - 12));
    const below = state.bottom + 8;
    const top = below + h > vh - 12 && state.top - h - 8 > 12 ? state.top - h - 8 : below;
    setPos({ left, top });
  }, [state.left, state.top, state.bottom, items.length]);

  useEffect(() => {
    panel.current?.querySelector(`[data-index="${selected}"]`)?.scrollIntoView({ block: "nearest" });
  }, [selected]);

  const current = items[selected];
  let lastGroup = "";

  return (
    <div
      ref={panel}
      onMouseDown={(e) => e.preventDefault()}
      style={{ left: pos.left, top: pos.top }}
      className="gj-pop fixed z-[85] flex origin-top-left overflow-hidden rounded-2xl bg-white shadow-[0_0_0_1px_rgba(201,193,177,0.7),0_24px_48px_-16px_rgba(44,59,77,0.32)]"
    >
      <div className={`flex max-h-[min(440px,60vh)] flex-col overflow-y-auto p-1.5 ${wide ? "w-[300px] border-r border-oatmeal/50" : "w-[280px]"}`}>
        <div className="mb-1 flex items-center gap-2 border-b border-oatmeal/40 px-2.5 pb-2.5 pt-2">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(44,59,77,0.55)" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <span className="font-mono text-xs text-blue-fantastic">{state.query || "buscar bloco"}</span>
          <span className="font-mono text-xs text-blue-fantastic/40">
            — {items.length} {items.length === 1 ? "resultado" : "resultados"}
          </span>
        </div>
        {items.length === 0 && <p className="px-3 py-6 text-center font-mono text-xs text-blue-fantastic/50">Nenhum bloco com esse nome.</p>}
        {items.map((it, i) => {
          const header = it.group !== lastGroup ? it.group : null;
          lastGroup = it.group;
          return (
            <div key={it.id}>
              {header && <p className="px-2.5 pb-1.5 pt-2.5 font-mono text-[10px] tracking-[0.08em] text-blue-fantastic/50">{header}</p>}
              <button
                type="button"
                data-index={i}
                onMouseMove={() => onHover(i)}
                onClick={() => onPick(it)}
                className={`flex w-full items-center gap-3 rounded-[10px] px-2.5 py-2 text-left transition-colors duration-100 ${
                  i === selected ? "bg-palladian shadow-[inset_0_0_0_1px_rgba(201,193,177,0.6)]" : ""
                }`}
              >
                {it.icon}
                <span className="flex min-w-0 flex-1 flex-col gap-px">
                  <span className={`truncate font-mono text-[13px] ${it.accent ? "font-semibold" : ""} ${it.accent && i !== selected ? "text-truffle-trouble" : "text-blue-fantastic"}`}>
                    {it.label}
                  </span>
                  {it.hint && <span className="truncate font-mono text-[11px] text-blue-fantastic/55">{it.hint}</span>}
                </span>
                {i === selected ? (
                  <span className="rounded-[5px] bg-white px-1.5 py-0.5 font-mono text-[11px] text-blue-fantastic/60 shadow-[inset_0_0_0_1px_rgba(201,193,177,0.8)]">↵</span>
                ) : (
                  it.shortcut && <span className="font-mono text-[10px] text-blue-fantastic/40">{it.shortcut}</span>
                )}
              </button>
            </div>
          );
        })}
        <div className="mt-1.5 flex items-center justify-between border-t border-oatmeal/40 px-2.5 pb-1.5 pt-3">
          <button type="button" onClick={onLibrary} className="font-mono text-[11px] text-truffle-trouble hover:underline">
            abrir biblioteca →
          </button>
          <span className="font-mono text-[11px] text-blue-fantastic/45">↑↓ navegar · esc</span>
        </div>
      </div>
      {wide && current && (
        <div key={current.id} className="gj-fade flex w-[300px] flex-col gap-3.5 bg-[#fcfbf8] p-[18px]">
          <div className="relative flex h-[150px] items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-oatmeal/70">
            {current.id === "interactive" ? (
              <>
                <InteractiveFrame html={PREVIEW_HTML} height={150} minHeight={150} />
                <span className="absolute left-2.5 top-2.5 flex items-center gap-1.5 rounded-full bg-truffle-trouble/[0.08] px-2 py-0.5 font-mono text-[10px] text-truffle-trouble">
                  <span className="h-[5px] w-[5px] rounded-full bg-truffle-trouble" /> ao vivo
                </span>
              </>
            ) : (
              <span className="scale-[2.2] opacity-80">{current.icon}</span>
            )}
          </div>
          <span className="font-mono text-[13px] font-semibold text-blue-fantastic">
            {current.id === "interactive" ? "Bloco interativo" : current.label}
          </span>
          <span className="font-mono text-xs leading-[19px] text-blue-fantastic/70">{current.description}</span>
        </div>
      )}
    </div>
  );
}
