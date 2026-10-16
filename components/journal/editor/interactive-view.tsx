"use client";

import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { useEffect, useRef, useState } from "react";
import { saveComponentAction } from "@/app/admin/actions";
import { Segmented, Toggle, inputCls } from "../admin/ui";
import InteractiveFrame from "../interactive-frame";
import { widthClass } from "@/lib/journal/layout";
import type { InteractiveAttrs } from "../interactive-block";
import ComponentStudio from "./component-studio";
import { useEditorCtx } from "./context";

const CursorIcon = ({ size = 12, stroke = "#fff", width = 2.6 }: { size?: number; stroke?: string; width?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 9 5 12 1.8-5.2L21 14z" />
    {size > 14 && <path d="M7.2 2.2 8 5.1M5.1 8l-2.9-.8M14 4.1 12 6M6 12l-1.9 2" />}
  </svg>
);

export default function InteractiveView({ node, updateAttributes, selected, deleteNode, editor, getPos }: NodeViewProps) {
  const attrs = node.attrs as InteractiveAttrs;
  const ctx = useEditorCtx();
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState(attrs.html ?? "");
  const [settings, setSettings] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [hover, setHover] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const hasCode = Boolean(attrs.html?.trim());
  const width = attrs.width ?? "wide";

  useEffect(() => {
    if (!selected) setSettings(false);
  }, [selected]);

  // Com o painel aberto, o editor de texto não deve roubar teclas (setas, enter, backspace).
  const stop = (e: React.KeyboardEvent) => e.stopPropagation();

  function finish() {
    const html = draft.trim() ? draft : "";
    updateAttributes({ html });
    setEditing(false);
    setExpanded(false);
    if (!html) deleteNode();
  }

  async function saveToLibrary() {
    setSaving(true);
    const r = await saveComponentAction(attrs.componentId ?? null, attrs.name || "Componente", attrs.html);
    setSaving(false);
    if (!r.ok) return ctx.toast(r.error, "error");
    updateAttributes({ componentId: r.data.id });
    await ctx.refreshComponents();
    ctx.toast(attrs.componentId ? "Biblioteca atualizada" : "Salvo na biblioteca");
    setSettings(false);
  }

  // ── Estado vazio ─────────────────────────────────────────────────────
  if (!hasCode && !editing) {
    return (
      <NodeViewWrapper className="relative pt-1.5" data-drag-handle>
        <Empty
          onCode={() => setEditing(true)}
          onLibrary={() =>
            ctx.openLibrary((c) => updateAttributes({ html: c.html, name: c.name, componentId: c.id }))
          }
        />
      </NodeViewWrapper>
    );
  }

  // ── Editando código ──────────────────────────────────────────────────
  if (editing) {
    const panel = (
      <div
        onKeyDown={stop}
        onPaste={(e) => e.stopPropagation()}
        className={`overflow-hidden rounded-[20px] bg-white shadow-[0_0_0_1.5px_#a35139,0_0_0_6px_rgba(163,81,57,0.08),0_30px_60px_-24px_rgba(44,59,77,0.35)] ${
          expanded ? "fixed inset-3 z-[95] gj-pop sm:inset-6" : "w-full max-w-[1200px]"
        }`}
      >
        {!hasCode && !draft.trim() && (
          <div className="flex items-center gap-2 border-b border-oatmeal/40 bg-[#fcfbf8] px-4 py-2.5 font-mono text-[11px] text-blue-fantastic/60">
            <span className="text-truffle-trouble">dica:</span> peça para a IA “gerar tudo em um único arquivo HTML, com CSS e JS
            embutidos” e cole aqui.
          </div>
        )}
        <ComponentStudio
          html={draft}
          onChange={setDraft}
          height={expanded ? Math.max(360, window.innerHeight - 140) : 520}
          previewWidth={width === "column" ? "720px" : width === "wide" ? "880px" : undefined}
          headerLeft={
            <>
              <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md bg-truffle-trouble">
                <CursorIcon />
              </span>
              <input
                value={attrs.name ?? ""}
                onChange={(e) => updateAttributes({ name: e.target.value.slice(0, 80) })}
                placeholder="Nome do componente"
                className="min-w-0 flex-1 bg-transparent font-mono text-[13px] font-semibold text-blue-fantastic outline-none placeholder:text-blue-fantastic/35"
              />
            </>
          }
          headerRight={
            <>
              <button
                type="button"
                title={expanded ? "Recolher" : "Expandir"}
                onClick={() => setExpanded((v) => !v)}
                className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-palladian active:scale-95"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2C3B4D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {expanded ? <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7" /> : <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />}
                </svg>
              </button>
              <button
                type="button"
                onClick={finish}
                className="rounded-[9px] bg-blue-fantastic px-3 py-2 font-mono text-xs font-semibold text-white transition active:scale-95"
              >
                Concluir
              </button>
            </>
          }
        />
      </div>
    );
    return (
      <NodeViewWrapper className="gj-breakout flex justify-center py-2" contentEditable={false}>
        {expanded && <div className="gj-fade fixed inset-0 z-[94] bg-[rgba(15,22,30,0.28)] backdrop-blur-[4px]" onClick={() => setExpanded(false)} />}
        {panel}
      </NodeViewWrapper>
    );
  }

  // ── Pronto: como o leitor vê + barra contextual quando selecionado ───
  return (
    <NodeViewWrapper
      ref={wrapper}
      className="gj-breakout relative flex flex-col items-center gap-3 pt-14"
      contentEditable={false}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onMouseDown={(e: React.MouseEvent) => {
        // Clicar em qualquer parte do bloco (fora dos controles) seleciona o bloco.
        const target = e.target as HTMLElement;
        if (target.closest("button, input, textarea, select, label")) return;
        const pos = getPos();
        if (typeof pos === "number") editor.commands.setNodeSelection(pos);
      }}
    >
      <div
        className={`absolute left-1/2 top-0 z-20 flex -translate-x-1/2 items-center gap-0.5 rounded-xl bg-white p-1 shadow-[0_0_0_1px_rgba(201,193,177,0.7),0_12px_24px_-10px_rgba(44,59,77,0.3)] transition-all duration-200 ${
          selected || hover ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-1 opacity-0"
        }`}
      >
        <Segmented
          value={width}
          onChange={(v) => updateAttributes({ width: v })}
          options={[
            { value: "column", label: "padrão" },
            { value: "wide", label: "ampla" },
            { value: "full", label: "total" },
          ]}
        />
        <span className="mx-1 h-5 w-px bg-oatmeal/70" />
        <button
          type="button"
          onClick={() => updateAttributes({ height: attrs.height === "auto" || !attrs.height ? 420 : "auto" })}
          className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 font-mono text-xs hover:bg-palladian"
          title="Altura"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2C3B4D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v18M8 7l4-4 4 4M8 17l4 4 4-4" />
          </svg>
          {attrs.height === "auto" || !attrs.height ? "auto" : `${attrs.height}px`}
        </button>
        <span className="mx-1 h-5 w-px bg-oatmeal/70" />
        <button
          type="button"
          onClick={() => {
            setDraft(attrs.html);
            setEditing(true);
          }}
          className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 font-mono text-xs hover:bg-palladian"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2C3B4D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m16 18 6-6-6-6M8 6l-6 6 6 6" />
          </svg>
          código
        </button>
        <button
          type="button"
          onClick={() => setSettings((s) => !s)}
          aria-expanded={settings}
          title="Configurações"
          className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${settings ? "bg-blue-fantastic text-white" : "hover:bg-palladian"}`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => deleteNode()}
          title="Remover bloco"
          className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-[#cf4238]/[0.08]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CF4238" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
          </svg>
        </button>
      </div>

      <div
        className={`${widthClass[width]} relative rounded-[20px] bg-[#fcfbf8] ring-1 ring-oatmeal/55 transition-[max-width,box-shadow] duration-300 ease-[cubic-bezier(.34,1.56,.64,1)] ${
          selected ? "shadow-[0_0_0_2px_#fff,0_0_0_4px_#a35139]" : ""
        }`}
      >
        <div className="pointer-events-auto overflow-hidden rounded-[20px]">
          <InteractiveFrame html={attrs.html} height={attrs.height ?? "auto"} resetKey={resetKey} title={attrs.name} />
        </div>
        {attrs.showReset !== false && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setResetKey((n) => n + 1);
            }}
            className="absolute right-3.5 top-3.5 flex items-center gap-1.5 rounded-full px-2.5 py-1.5 font-mono text-[11px] text-blue-fantastic/70 transition hover:bg-white hover:shadow-sm"
          >
            ↺ reiniciar
          </button>
        )}
        {settings && (
          <Settings
            attrs={attrs}
            update={updateAttributes}
            onKeyDown={stop}
            onEditCode={() => {
              setDraft(attrs.html);
              setEditing(true);
            }}
            onReplace={() => {
              setDraft("");
              setEditing(true);
            }}
            onSaveLibrary={saveToLibrary}
            saving={saving}
          />
        )}
      </div>
      <input
        value={attrs.caption ?? ""}
        onChange={(e) => updateAttributes({ caption: e.target.value.slice(0, 300) })}
        onKeyDown={stop}
        placeholder="Legenda (opcional)"
        className="w-full max-w-[720px] bg-transparent px-2 text-center font-mono text-[13px] text-blue-fantastic/60 outline-none placeholder:text-blue-fantastic/30 focus:text-blue-fantastic"
      />
    </NodeViewWrapper>
  );
}

function Empty({ onCode, onLibrary }: { onCode: () => void; onLibrary: () => void }) {
  return (
    <div className="relative" contentEditable={false}>
      <span className="absolute left-3.5 -top-2 z-10 flex items-center gap-1.5 rounded-full bg-white py-0.5 pl-1.5 pr-2 font-mono text-[11px] text-truffle-trouble shadow-[inset_0_0_0_1px_rgba(163,81,57,0.35)]">
        <span className="flex h-3.5 w-3.5 items-center justify-center rounded-[4px] bg-truffle-trouble">
          <CursorIcon size={8} width={3} />
        </span>
        interativo
      </span>
      <div className="flex flex-col items-center gap-[18px] rounded-[20px] border-[1.5px] border-dashed border-truffle-trouble/35 bg-[#fcfbf8] px-6 pb-11 pt-14 text-center">
        <span className="flex h-[52px] w-[52px] items-center justify-center rounded-[14px] bg-white shadow-[0_0_0_1px_rgba(201,193,177,0.8),0_8px_18px_-8px_rgba(163,81,57,0.45)]">
          <CursorIcon size={24} stroke="#A35139" width={1.8} />
        </span>
        <span className="flex flex-col gap-1.5">
          <span className="font-sans text-[19px] font-semibold tracking-[-0.01em] text-blue-fantastic">
            Crie experiências interativas para seus leitores.
          </span>
          <span className="font-mono text-[13px] leading-5 text-blue-fantastic/65">
            Cole um arquivo HTML completo. CSS e JavaScript embutidos funcionam.
          </span>
        </span>
        <span className="flex flex-wrap justify-center gap-2.5 pt-1.5">
          <button
            type="button"
            onClick={onCode}
            className="flex items-center gap-2.5 rounded-[11px] bg-blue-fantastic py-2.5 pl-4 pr-3 font-mono text-[13px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_6px_14px_-6px_rgba(44,59,77,0.55)] transition hover:-translate-y-px active:scale-[0.97]"
          >
            Inserir código <span className="rounded-[5px] bg-white/[0.12] px-1.5 py-0.5 text-[11px] font-normal text-white/75">⌘V</span>
          </button>
          <button
            type="button"
            onClick={onLibrary}
            className="rounded-[11px] bg-white px-4 py-2.5 font-mono text-[13px] text-blue-fantastic ring-1 ring-oatmeal/90 transition hover:bg-palladian active:scale-[0.97]"
          >
            Da biblioteca
          </button>
        </span>
        <span className="flex items-center gap-2 pt-2.5 font-mono text-xs text-blue-fantastic/55">
          ⓘ dica: peça para a IA “gerar tudo em um único arquivo HTML”
        </span>
      </div>
    </div>
  );
}

function Settings({
  attrs,
  update,
  onKeyDown,
  onEditCode,
  onReplace,
  onSaveLibrary,
  saving,
}: {
  attrs: InteractiveAttrs;
  update: (a: Partial<InteractiveAttrs>) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onEditCode: () => void;
  onReplace: () => void;
  onSaveLibrary: () => void;
  saving: boolean;
}) {
  const fixed = attrs.height !== "auto" && !!attrs.height;
  return (
    <div
      onKeyDown={onKeyDown}
      onClick={(e) => e.stopPropagation()}
      className="gj-pop absolute right-2 top-12 z-30 flex w-[300px] origin-top-right flex-col rounded-2xl bg-white text-left shadow-[0_0_0_1px_rgba(201,193,177,0.7),0_30px_60px_-20px_rgba(44,59,77,0.38)] sm:-right-4"
    >
      <div className="flex flex-col gap-3.5 p-4">
        <span className="font-mono text-[10px] tracking-[0.08em] text-blue-fantastic/50">CONFIGURAÇÕES DO BLOCO</span>
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[11px] text-blue-fantastic/65">Nome</span>
          <input value={attrs.name ?? ""} onChange={(e) => update({ name: e.target.value.slice(0, 80) })} className={`${inputCls} h-[34px] text-xs`} />
        </label>
        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-[11px] text-blue-fantastic/65">Altura</span>
          <div className="flex gap-1.5">
            <div className="flex-1">
              <Segmented
                value={fixed ? "fixed" : "auto"}
                onChange={(v) => update({ height: v === "auto" ? "auto" : 420 })}
                options={[
                  { value: "auto", label: "auto" },
                  { value: "fixed", label: "fixa" },
                ]}
              />
            </div>
            <label
              className={`flex h-8 w-[84px] items-center justify-between rounded-[9px] px-2.5 ring-1 transition ${fixed ? "ring-[1.5px] ring-blue-fantastic" : "opacity-40 ring-oatmeal/90"}`}
            >
              <input
                type="number"
                min={120}
                max={1600}
                disabled={!fixed}
                value={fixed ? Number(attrs.height) : ""}
                onChange={(e) => update({ height: Math.max(120, Math.min(1600, Number(e.target.value) || 120)) })}
                className="w-12 bg-transparent font-mono text-xs outline-none"
              />
              <span className="font-mono text-[11px] text-blue-fantastic/50">px</span>
            </label>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-[11px] text-blue-fantastic/65">Alinhamento</span>
          <Segmented
            value={attrs.align ?? "center"}
            onChange={(v) => update({ align: v })}
            options={[
              { value: "left", label: "esquerda" },
              { value: "center", label: "centro" },
              { value: "right", label: "direita" },
            ]}
          />
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[11px] text-blue-fantastic/65">Legenda</span>
          <textarea
            value={attrs.caption ?? ""}
            onChange={(e) => update({ caption: e.target.value.slice(0, 300) })}
            rows={2}
            className={`${inputCls} resize-none py-2 text-xs leading-[18px]`}
          />
        </label>
        <div className="flex items-center justify-between gap-3">
          <span className="flex flex-col gap-px">
            <span className="font-mono text-xs">Botão de reiniciar</span>
            <span className="font-mono text-[10px] text-blue-fantastic/50">o leitor volta ao estado inicial</span>
          </span>
          <Toggle checked={attrs.showReset !== false} onChange={(v) => update({ showReset: v })} label="Botão de reiniciar" />
        </div>
      </div>
      <div className="flex flex-col border-t border-oatmeal/50 p-1.5">
        <button type="button" onClick={onEditCode} className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left font-mono text-xs hover:bg-palladian">
          ‹›<span className="flex-1">Editar código</span>
        </button>
        <button type="button" onClick={onReplace} className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left font-mono text-xs hover:bg-palladian">
          ↻<span className="flex-1">Substituir código</span>
        </button>
        <button
          type="button"
          onClick={onSaveLibrary}
          disabled={saving}
          className="flex items-center gap-2.5 rounded-lg bg-truffle-trouble/[0.07] px-2.5 py-2 text-left font-mono text-xs text-truffle-trouble hover:bg-truffle-trouble/[0.12] disabled:opacity-60"
        >
          ◆<span className="flex-1">{saving ? "Salvando…" : attrs.componentId ? "Atualizar na biblioteca" : "Salvar na biblioteca"}</span>
        </button>
      </div>
    </div>
  );
}
