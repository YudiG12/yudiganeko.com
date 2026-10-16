"use client";

import { NodeViewContent, NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { LANGUAGE_LABELS } from "../code-block";

export default function CodeBlockView({ node, updateAttributes }: NodeViewProps) {
  const language = (node.attrs.language as string) || "plaintext";
  return (
    <NodeViewWrapper className="gj-code overflow-hidden rounded-2xl bg-[#1f2733]">
      <div contentEditable={false} className="flex h-9 items-center justify-between border-b border-white/[0.06] px-4">
        <select
          value={language}
          onChange={(e) => updateAttributes({ language: e.target.value })}
          className="cursor-pointer bg-transparent font-mono text-[11px] text-palladian/60 outline-none hover:text-palladian"
        >
          {Object.entries(LANGUAGE_LABELS).map(([k, v]) => (
            <option key={k} value={k} className="text-blue-fantastic">
              {v}
            </option>
          ))}
        </select>
        <span className="font-mono text-[10px] text-palladian/35">código</span>
      </div>
      <pre className="overflow-x-auto px-5 py-4 font-mono text-[13px] leading-[1.7] text-[#d8d2c4]">
        <NodeViewContent<"code"> as="code" />
      </pre>
    </NodeViewWrapper>
  );
}
