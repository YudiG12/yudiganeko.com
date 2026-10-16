"use client";

import { useState } from "react";

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1400);
        } catch {}
      }}
      className="rounded-md px-2 py-1 font-mono text-[11px] text-palladian/55 transition hover:bg-white/10 hover:text-palladian active:scale-95"
    >
      {copied ? "copiado ✓" : "copiar"}
    </button>
  );
}
