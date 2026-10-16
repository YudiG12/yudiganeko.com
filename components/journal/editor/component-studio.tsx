"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import InteractiveFrame, { type FrameError } from "../interactive-frame";
import { Segmented } from "../admin/ui";
import type { CodeEditorHandle } from "./code-editor";

const CodeEditor = dynamic(() => import("./code-editor"), {
  ssr: false,
  loading: () => <div className="h-full bg-[#1f2733]" />,
});

export type StudioMode = "code" | "split" | "preview";

/**
 * Painel de criação do componente interativo: código (CodeMirror) + prévia ao vivo no mesmo
 * sandbox usado na página publicada. Com erro, a prévia mantém a última versão que funcionou.
 */
export default function ComponentStudio({
  html,
  onChange,
  height = 520,
  initialMode,
  previewWidth,
  headerLeft,
  headerRight,
}: {
  html: string;
  onChange: (html: string) => void;
  height?: number;
  initialMode?: StudioMode;
  previewWidth?: string;
  headerLeft?: React.ReactNode;
  headerRight?: React.ReactNode;
}) {
  const [narrow, setNarrow] = useState(false);
  const [mode, setMode] = useState<StudioMode>(initialMode ?? (html.trim() ? "split" : "code"));
  const [live, setLive] = useState(html);
  const [lastGood, setLastGood] = useState(html);
  const [error, setError] = useState<FrameError | null>(null);
  const [reset, setReset] = useState(0);
  const editor = useRef<CodeEditorHandle>(null);
  const pendingError = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const f = () => setNarrow(mq.matches);
    f();
    mq.addEventListener("change", f);
    return () => mq.removeEventListener("change", f);
  }, []);
  useEffect(() => {
    if (narrow && mode === "split") setMode("code");
  }, [narrow, mode]);

  // Prévia atualiza 300 ms depois da última tecla.
  useEffect(() => {
    const t = setTimeout(() => {
      pendingError.current = false;
      setError(null);
      setLive(html);
    }, 300);
    return () => clearTimeout(t);
  }, [html]);

  // Se o código novo não disparar erro em 700 ms, vira a "última versão que funcionou".
  useEffect(() => {
    const t = setTimeout(() => {
      if (!pendingError.current) setLastGood(live);
    }, 700);
    return () => clearTimeout(t);
  }, [live]);

  const onError = useCallback((e: FrameError) => {
    pendingError.current = true;
    setError(e);
  }, []);

  const showing = error ? lastGood : live;
  const modes: { value: StudioMode; label: string }[] = narrow
    ? [
        { value: "code", label: "Código" },
        { value: "preview", label: "Prévia" },
      ]
    : [
        { value: "code", label: "Código" },
        { value: "split", label: "Dividido" },
        { value: "preview", label: "Prévia" },
      ];

  return (
    <div className="flex flex-col">
      <div className="flex h-[52px] items-center justify-between gap-3 border-b border-oatmeal/50 pl-4 pr-3">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">{headerLeft}</div>
        <div className="w-auto shrink-0">
          <Segmented value={mode} onChange={setMode} options={modes} size="md" />
        </div>
        <div className="flex flex-1 items-center justify-end gap-1.5">{headerRight}</div>
      </div>
      <div className="flex" style={{ height }}>
        <div
          className={`flex flex-col overflow-hidden bg-[#1f2733] transition-[width,opacity] duration-300 ease-[cubic-bezier(.34,1.56,.64,1)] ${
            mode === "preview" ? "w-0 opacity-0" : mode === "split" ? "w-1/2 opacity-100" : "w-full opacity-100"
          }`}
        >
          <div className="flex h-9 shrink-0 items-center justify-between border-b border-white/[0.06] px-3.5 font-mono text-[11px] text-palladian/45">
            <span>componente.html</span>
            <span>{html.split("\n").length} linhas</span>
          </div>
          <div className="min-h-0 flex-1">
            <CodeEditor ref={editor} value={html} onChange={onChange} autoFocus={!html.trim()} />
          </div>
          {error && (
            <div className="gj-rise flex shrink-0 items-center gap-2.5 border-t border-[#cf4238]/35 bg-[#cf4238]/[0.14] px-3.5 py-2.5">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#cf4238] font-mono text-[10px] font-bold text-white">!</span>
              <span className="min-w-0 flex-1 truncate font-mono text-xs text-[#ffd9d4]">
                {error.line ? `Linha ${error.line} · ` : ""}
                {error.message}
              </span>
              {error.line > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (mode === "preview") setMode(narrow ? "code" : "split");
                    setTimeout(() => editor.current?.goToLine(error.line), 50);
                  }}
                  className="shrink-0 rounded-md bg-white/10 px-2 py-1 font-mono text-[11px] text-white transition hover:bg-white/20"
                >
                  ir para linha
                </button>
              )}
            </div>
          )}
        </div>
        <div
          className={`flex min-w-0 flex-col bg-white transition-[width,opacity] duration-300 ease-[cubic-bezier(.34,1.56,.64,1)] ${
            mode === "code" ? "w-0 opacity-0" : mode === "split" ? "w-1/2 opacity-100" : "w-full opacity-100"
          }`}
        >
          <div className="flex h-9 shrink-0 items-center justify-between border-b border-oatmeal/40 px-3.5">
            <span className="flex items-center gap-1.5 truncate font-mono text-[11px] text-blue-fantastic/65">
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${error ? "bg-[#b87a12]" : "bg-[#2f8a5b] animate-[gj-pulse-dot_2s_ease-in-out_infinite]"}`}
              />
              {error ? "última versão que funcionou" : "ao vivo"}
            </span>
            <button
              type="button"
              title="Reiniciar"
              onClick={() => setReset((n) => n + 1)}
              className="rounded-md p-1 text-blue-fantastic/70 transition hover:bg-palladian hover:text-blue-fantastic active:rotate-[-90deg]"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M8 16H3v5" />
              </svg>
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-auto bg-[#fcfbf8]">
            {showing.trim() ? (
              <div className="mx-auto p-4" style={{ maxWidth: previewWidth }}>
                <InteractiveFrame html={showing} onError={onError} resetKey={reset} minHeight={80} />
              </div>
            ) : (
              <div className="flex h-full items-center justify-center p-6 text-center font-mono text-xs text-blue-fantastic/45">
                A prévia aparece aqui assim que você colar o código.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
