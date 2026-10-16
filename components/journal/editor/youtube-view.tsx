"use client";

import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { useState } from "react";
import { youtubeId } from "@/lib/journal/content";
import YouTubeEmbed from "../youtube-embed";
import { inputCls } from "../admin/ui";

export default function YoutubeView({ node, updateAttributes, deleteNode, selected }: NodeViewProps) {
  const { videoId, title } = node.attrs as { videoId: string; title: string };
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  if (!videoId) {
    return (
      <NodeViewWrapper contentEditable={false}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const id = youtubeId(url);
            if (!id) return setError("Esse link não parece ser do YouTube.");
            updateAttributes({ videoId: id });
          }}
          className="flex flex-col gap-3 rounded-[18px] bg-[#fcfbf8] p-5 ring-1 ring-oatmeal/60"
        >
          <span className="flex items-center gap-2 font-mono text-[13px] font-semibold">
            <svg width="20" height="14" viewBox="0 0 28 20">
              <rect width="28" height="20" rx="6" fill="#FF0033" />
              <path d="M11 5.5v9l8-4.5z" fill="#FFFFFF" />
            </svg>
            Vídeo do YouTube
          </span>
          <div className="flex gap-2">
            <input
              autoFocus
              value={url}
              onKeyDown={(e) => e.stopPropagation()}
              onChange={(e) => {
                setUrl(e.target.value);
                setError("");
              }}
              placeholder="Cole o link do vídeo"
              className={`${inputCls} h-10 flex-1`}
            />
            <button className="h-10 rounded-xl bg-blue-fantastic px-4 font-mono text-xs font-semibold text-white active:scale-95">Inserir</button>
            <button type="button" onClick={() => deleteNode()} className="h-10 rounded-xl px-3 font-mono text-xs text-blue-fantastic/60 hover:bg-white">
              cancelar
            </button>
          </div>
          {error && <span className="font-mono text-xs text-[#cf4238]">{error}</span>}
        </form>
      </NodeViewWrapper>
    );
  }
  return (
    <NodeViewWrapper contentEditable={false} data-drag-handle className={`flex flex-col gap-2 rounded-[18px] transition-shadow ${selected ? "shadow-[0_0_0_2px_#fff,0_0_0_4px_#a35139]" : ""}`}>
      <YouTubeEmbed videoId={videoId} title={title || undefined} />
      <input
        value={title ?? ""}
        onKeyDown={(e) => e.stopPropagation()}
        onChange={(e) => updateAttributes({ title: e.target.value.slice(0, 160) })}
        placeholder="Título do vídeo (aparece no card)"
        className="bg-transparent px-1 text-center font-mono text-[12px] text-blue-fantastic/60 outline-none placeholder:text-blue-fantastic/30"
      />
    </NodeViewWrapper>
  );
}
