"use client";

import { html } from "@codemirror/lang-html";
import { EditorView } from "@codemirror/view";
import CodeMirror, { type ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { forwardRef, useImperativeHandle, useRef } from "react";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";

const theme = EditorView.theme(
  {
    "&": { backgroundColor: "#1f2733", color: "#d8d2c4", height: "100%", fontSize: "12.5px" },
    ".cm-scroller": { fontFamily: "var(--font-geist-mono), ui-monospace, monospace", lineHeight: "21px" },
    ".cm-content": { padding: "14px 0", caretColor: "#ffb162" },
    ".cm-gutters": { backgroundColor: "#1f2733", color: "rgba(249,247,244,0.25)", border: "none" },
    ".cm-lineNumbers .cm-gutterElement": { padding: "0 16px 0 14px", minWidth: "44px" },
    ".cm-activeLine": { backgroundColor: "rgba(255,255,255,0.03)" },
    ".cm-activeLineGutter": { backgroundColor: "transparent", color: "rgba(249,247,244,0.6)" },
    "&.cm-focused .cm-cursor": { borderLeftColor: "#ffb162" },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": { backgroundColor: "rgba(255,177,98,0.18) !important" },
    ".cm-gj-error": { backgroundColor: "rgba(207,66,56,0.16)", boxShadow: "inset 2px 0 0 #cf4238" },
    "&.cm-focused": { outline: "none" },
  },
  { dark: true },
);

const highlight = HighlightStyle.define([
  { tag: [t.tagName, t.angleBracket, t.number, t.bool, t.atom], color: "#ffb162" },
  { tag: [t.attributeName, t.propertyName], color: "#c9c1b1" },
  { tag: [t.string, t.attributeValue, t.special(t.string)], color: "#9fcfa8" },
  { tag: [t.keyword, t.operatorKeyword, t.modifier, t.controlKeyword, t.definitionKeyword], color: "#f0a58f" },
  { tag: [t.function(t.variableName), t.function(t.propertyName), t.className], color: "#8ec5f0" },
  { tag: [t.comment, t.lineComment, t.blockComment], color: "rgba(249,247,244,0.38)", fontStyle: "italic" },
  { tag: [t.variableName, t.punctuation, t.operator], color: "#d8d2c4" },
]);

export type CodeEditorHandle = { goToLine: (line: number) => void; focus: () => void };

const CodeEditor = forwardRef<CodeEditorHandle, { value: string; onChange: (v: string) => void; autoFocus?: boolean }>(
  function CodeEditor({ value, onChange, autoFocus }, ref) {
    const cm = useRef<ReactCodeMirrorRef>(null);
    useImperativeHandle(ref, () => ({
      goToLine(line: number) {
        const view = cm.current?.view;
        if (!view) return;
        const l = view.state.doc.line(Math.max(1, Math.min(line, view.state.doc.lines)));
        view.dispatch({ selection: { anchor: l.from, head: l.to }, effects: EditorView.scrollIntoView(l.from, { y: "center" }) });
        view.focus();
      },
      focus() {
        cm.current?.view?.focus();
      },
    }));
    return (
      <CodeMirror
        ref={cm}
        value={value}
        onChange={onChange}
        autoFocus={autoFocus}
        height="100%"
        theme={theme}
        basicSetup={{ highlightActiveLine: true, foldGutter: false, autocompletion: true, bracketMatching: true }}
        extensions={[html(), syntaxHighlighting(highlight), EditorView.lineWrapping]}
        placeholder="Cole aqui o HTML gerado pela IA (pode ser o arquivo inteiro, com <style> e <script>)…"
        className="h-full [&_.cm-placeholder]:text-palladian/30"
      />
    );
  },
);

export default CodeEditor;
