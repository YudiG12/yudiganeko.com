"use client";

import type { Editor } from "@tiptap/core";
import { BubbleMenu } from "@tiptap/react/menus";
import { useState } from "react";

const Btn = ({ active, onClick, title, children }: { active?: boolean; onClick: () => void; title: string; children: React.ReactNode }) => (
  <button
    type="button"
    title={title}
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    className={`flex h-8 w-8 items-center justify-center rounded-lg text-[#f9f7f4] transition-colors duration-100 active:scale-90 ${
      active ? "bg-white/[0.14] text-white" : "hover:bg-white/[0.08]"
    }`}
  >
    {children}
  </button>
);
const Sep = () => <span className="mx-0.5 h-[18px] w-px bg-white/[0.18]" />;

export function FormatToolbar({ editor }: { editor: Editor }) {
  const [linkMode, setLinkMode] = useState(false);
  const [href, setHref] = useState("");
  const [typeOpen, setTypeOpen] = useState(false);
  const level = [2, 3, 4].find((l) => editor.isActive("heading", { level: l }));
  const types = [
    { label: "Texto", run: () => editor.chain().focus().setParagraph().run(), active: !level },
    { label: "Título", run: () => editor.chain().focus().setHeading({ level: 2 }).run(), active: level === 2 },
    { label: "Subtítulo", run: () => editor.chain().focus().setHeading({ level: 3 }).run(), active: level === 3 },
    { label: "Título menor", run: () => editor.chain().focus().setHeading({ level: 4 }).run(), active: level === 4 },
  ];

  return (
    <BubbleMenu
      editor={editor}
      options={{ placement: "top", offset: 10 }}
      shouldShow={({ editor, state }) => {
        const { empty } = state.selection;
        if (empty || editor.isActive("codeBlock") || editor.isActive("image") || editor.isActive("interactive")) return false;
        return !("node" in state.selection);
      }}
      className="gj-pop flex items-center gap-0.5 rounded-xl bg-blue-fantastic p-1 shadow-[0_12px_24px_-8px_rgba(44,59,77,0.45),0_2px_4px_rgba(44,59,77,0.2)]"
    >
      {linkMode ? (
        <form
          className="flex items-center gap-1 px-1"
          onSubmit={(e) => {
            e.preventDefault();
            const v = href.trim();
            if (!v) editor.chain().focus().unsetLink().run();
            else editor.chain().focus().extendMarkRange("link").setLink({ href: /^(https?:|mailto:|\/|#)/.test(v) ? v : `https://${v}` }).run();
            setLinkMode(false);
          }}
        >
          <input
            autoFocus
            value={href}
            onChange={(e) => setHref(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setLinkMode(false)}
            placeholder="cole o link e aperte enter"
            className="h-8 w-56 bg-transparent px-2 font-mono text-xs text-white outline-none placeholder:text-white/40"
          />
          {editor.isActive("link") && (
            <button type="button" onClick={() => (editor.chain().focus().unsetLink().run(), setLinkMode(false))} className="px-2 font-mono text-[11px] text-[#ffb162]">
              remover
            </button>
          )}
        </form>
      ) : (
        <>
          <div className="relative">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setTypeOpen((o) => !o)}
              className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 font-mono text-xs text-[#f9f7f4] hover:bg-white/[0.08]"
            >
              {types.find((t) => t.active)?.label}
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            {typeOpen && (
              <div className="gj-pop absolute left-0 top-10 flex w-40 flex-col rounded-xl bg-white p-1 shadow-[0_0_0_1px_rgba(201,193,177,0.7),0_16px_32px_-12px_rgba(44,59,77,0.35)]">
                {types.map((t) => (
                  <button
                    key={t.label}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => (t.run(), setTypeOpen(false))}
                    className={`rounded-lg px-2.5 py-1.5 text-left font-mono text-xs ${t.active ? "bg-palladian text-blue-fantastic" : "text-blue-fantastic/75 hover:bg-palladian"}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Sep />
          <Btn title="Negrito (⌘B)" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
            <span className="font-sans text-[15px] font-extrabold">B</span>
          </Btn>
          <Btn title="Itálico (⌘I)" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
            <span className="font-sans text-[15px] italic">I</span>
          </Btn>
          <Btn title="Sublinhado (⌘U)" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
            <span className="font-sans text-[15px] underline">U</span>
          </Btn>
          <Btn title="Tachado" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
            <span className="font-sans text-[15px] line-through">S</span>
          </Btn>
          <Btn title="Código (⌘E)" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m16 18 6-6-6-6M8 6l-6 6 6 6" />
            </svg>
          </Btn>
          <Btn
            title="Link (⌘K)"
            active={editor.isActive("link")}
            onClick={() => {
              setHref((editor.getAttributes("link").href as string) ?? "");
              setLinkMode(true);
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
              <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
            </svg>
          </Btn>
          <Sep />
          <Btn title="Citação" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
            <span className="font-sans text-lg leading-none">“</span>
          </Btn>
          <Btn title="Marca-texto" active={editor.isActive("highlight")} onClick={() => editor.chain().focus().toggleHighlight().run()}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFB162" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08" />
              <path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z" />
            </svg>
          </Btn>
        </>
      )}
    </BubbleMenu>
  );
}

export function TableToolbar({ editor }: { editor: Editor }) {
  const item = (label: string, run: () => void, danger = false) => (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={run}
      className={`rounded-lg px-2.5 py-1.5 font-mono text-[11px] transition-colors ${danger ? "text-[#cf4238] hover:bg-[#cf4238]/[0.08]" : "text-blue-fantastic hover:bg-palladian"}`}
    >
      {label}
    </button>
  );
  return (
    <BubbleMenu
      editor={editor}
      pluginKey="tableMenu"
      options={{ placement: "top", offset: 12 }}
      shouldShow={({ editor }) => editor.isActive("table") && editor.isFocused}
      className="flex items-center gap-0.5 rounded-xl bg-white p-1 shadow-[0_0_0_1px_rgba(201,193,177,0.7),0_12px_24px_-10px_rgba(44,59,77,0.3)]"
    >
      {item("+ linha", () => editor.chain().focus().addRowAfter().run())}
      {item("+ coluna", () => editor.chain().focus().addColumnAfter().run())}
      {item("− linha", () => editor.chain().focus().deleteRow().run())}
      {item("− coluna", () => editor.chain().focus().deleteColumn().run())}
      {item("cabeçalho", () => editor.chain().focus().toggleHeaderRow().run())}
      {item("excluir tabela", () => editor.chain().focus().deleteTable().run(), true)}
    </BubbleMenu>
  );
}
