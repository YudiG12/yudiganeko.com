"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

/**
 * Executa o HTML/CSS/JS de um componente interativo isolado do site:
 * - iframe com `sandbox="allow-scripts"` (sem allow-same-origin → origem opaca, sem cookies,
 *   sem acesso ao DOM do pai, sem navegação do topo, sem formulários, sem popups);
 * - CSP própria dentro do documento (sem fetch/XHR/WebSocket: connect-src 'none');
 * - a única comunicação é postMessage de altura/erro, validada pela origem da janela.
 */
const CSP = [
  "default-src 'none'",
  "script-src 'unsafe-inline' 'unsafe-eval' https:",
  "style-src 'unsafe-inline' https:",
  "img-src data: blob: https:",
  "font-src data: https:",
  "media-src data: blob: https:",
  "connect-src 'none'",
  "form-action 'none'",
  "base-uri 'none'",
].join("; ");

export function buildSrcDoc(html: string, frameId: string, autoHeight = true) {
  // Tudo numa linha só: assim o número da linha dos erros bate com o código colado.
  const head =
    `<meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${CSP}">` +
    `<meta name="viewport" content="width=device-width,initial-scale=1">` +
    // Altura automática: o iframe acompanha o conteúdo, então nunca deve rolar por dentro — senão a
    // barra aparece por um instante, estreita o conteúdo e muda as quebras de linha/espaçamentos.
    // flow-root faz a altura medida do body incluir as margens dos filhos.
    `<style>html,body{margin:0;background:transparent}${
      autoHeight ? "html,body{overflow:hidden!important}" : "html{scrollbar-gutter:stable}"
    }body{display:flow-root;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;color:#2c3b4d;-webkit-font-smoothing:antialiased}</style>` +
    `<script>(function(){var id=${JSON.stringify(frameId)};function post(m){m.__gj=id;parent.postMessage(m,"*")}` +
    `var last=0;function h(){var b=document.body;if(!b)return;var v=Math.ceil(Math.max(b.getBoundingClientRect().height,b.scrollHeight));if(v!==last){last=v;post({type:"height",value:v})}}` +
    `window.addEventListener("load",h);if(window.ResizeObserver){document.addEventListener("DOMContentLoaded",function(){new ResizeObserver(h).observe(document.body)})}` +
    `setTimeout(h,60);window.addEventListener("error",function(e){post({type:"error",message:String(e.message||e),line:e.lineno||0})});` +
    `post({type:"ready"})})();</script>`;
  const src = html ?? "";
  if (/<head[^>]*>/i.test(src)) return src.replace(/<head[^>]*>/i, (m) => m + head);
  if (/<html[^>]*>/i.test(src)) return src.replace(/<html[^>]*>/i, (m) => `${m}<head>${head}</head>`);
  return `<!doctype html><html><head>${head}</head><body>${src}</body></html>`;
}

export type FrameError = { message: string; line: number };

export default function InteractiveFrame({
  html,
  height = "auto",
  title = "Componente interativo",
  resetKey = 0,
  onError,
  onReady,
  className = "",
  minHeight = 120,
}: {
  html: string;
  height?: "auto" | number;
  title?: string;
  resetKey?: number;
  onError?: (e: FrameError) => void;
  onReady?: () => void;
  className?: string;
  minHeight?: number;
}) {
  const reactId = useId();
  const frameId = useMemo(() => `gj${reactId.replace(/[^a-z0-9]/gi, "")}`, [reactId]);
  const ref = useRef<HTMLIFrameElement>(null);
  const [autoH, setAutoH] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);
  // Só monta o iframe no navegador: assim os listeners já existem quando o componente carrega
  // (no HTML do servidor o load poderia acontecer antes da hidratação e a altura se perderia).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const autoHeight = height === "auto";
  const srcDoc = useMemo(() => buildSrcDoc(html, frameId, autoHeight), [html, frameId, autoHeight]);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (!ref.current || e.source !== ref.current.contentWindow) return;
      const d = e.data as { __gj?: string; type?: string; value?: number; message?: string; line?: number };
      if (!d || d.__gj !== frameId) return;
      if (d.type === "height" && typeof d.value === "number") {
        setAutoH(Math.max(minHeight, Math.min(4000, d.value)));
      } else if (d.type === "error") {
        onError?.({ message: String(d.message ?? "Erro"), line: Number(d.line ?? 0) });
      } else if (d.type === "ready") {
        setLoaded(true);
        onReady?.();
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [frameId, minHeight, onError, onReady]);

  const h = height === "auto" ? autoH ?? 320 : height;

  if (!mounted) return <div aria-hidden style={{ height: h }} className={className} />;

  return (
    <iframe
      key={resetKey}
      ref={ref}
      title={title}
      srcDoc={srcDoc}
      sandbox="allow-scripts"
      referrerPolicy="no-referrer"
      loading="lazy"
      scrolling={autoHeight ? "no" : undefined}
      onLoad={() => setLoaded(true)}
      style={{ height: h }}
      className={`block w-full border-0 bg-transparent transition-[height,opacity] duration-300 ease-[cubic-bezier(.22,1,.36,1)] ${
        loaded ? "opacity-100" : "opacity-0"
      } ${className}`}
    />
  );
}
