"use client";

import { useEffect, useState } from "react";
import { REACTIONS, type ReactionEmoji } from "@/lib/journal/types";

export default function Reactions({
  articleId,
  initial,
}: {
  articleId: string;
  initial: Partial<Record<ReactionEmoji, number>>;
}) {
  const storageKey = `gj-reacted-${articleId}`;
  const [counts, setCounts] = useState(initial);
  const [mine, setMine] = useState<ReactionEmoji[]>([]);
  const [popped, setPopped] = useState<ReactionEmoji | null>(null);

  useEffect(() => {
    try {
      setMine(JSON.parse(localStorage.getItem(storageKey) ?? "[]"));
    } catch {}
  }, [storageKey]);

  async function toggle(emoji: ReactionEmoji) {
    const has = mine.includes(emoji);
    const delta = has ? -1 : 1;
    const next = has ? mine.filter((e) => e !== emoji) : [...mine, emoji];
    setMine(next);
    setCounts((c) => ({ ...c, [emoji]: Math.max(0, (c[emoji] ?? 0) + delta) }));
    if (!has) {
      setPopped(emoji);
      setTimeout(() => setPopped(null), 320);
    }
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {}
    try {
      const res = await fetch("/api/journal/react", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId, emoji, delta }),
      });
      if (res.ok) {
        const { count } = await res.json();
        if (typeof count === "number") setCounts((c) => ({ ...c, [emoji]: count }));
      }
    } catch {}
  }

  const top = [...mine].pop();
  const total = Object.values(counts).reduce((a, b) => a + (b ?? 0), 0);

  return (
    <section aria-label="Reações" className="flex flex-col items-center gap-4 border-b border-oatmeal/50 py-14">
      <span className="font-mono text-[13px] text-blue-fantastic/70">O que achou?</span>
      <div className="flex flex-wrap justify-center gap-2">
        {REACTIONS.map((emoji) => {
          const active = mine.includes(emoji);
          return (
            <button
              key={emoji}
              type="button"
              onClick={() => toggle(emoji)}
              aria-pressed={active}
              className={`flex items-center gap-2 rounded-full px-3.5 py-2 transition-all duration-200 ease-[cubic-bezier(.34,1.56,.64,1)] hover:-translate-y-0.5 active:scale-95 ${
                active
                  ? "bg-truffle-trouble/[0.08] shadow-[inset_0_0_0_1.5px_#A35139]"
                  : "shadow-[inset_0_0_0_1px_rgba(201,193,177,0.9)] hover:bg-palladian"
              }`}
            >
              <span
                className={`text-lg leading-5 transition-transform duration-300 ease-[cubic-bezier(.34,1.56,.64,1)] ${
                  popped === emoji ? "scale-125" : "scale-100"
                }`}
              >
                {emoji}
              </span>
              <span
                className={`font-mono text-[13px] tabular-nums ${active ? "font-semibold text-truffle-trouble" : "text-blue-fantastic"}`}
              >
                {counts[emoji] ?? 0}
              </span>
            </button>
          );
        })}
      </div>
      <span className="h-4 font-mono text-xs text-blue-fantastic/50">
        {top && total > 1 ? `você e mais ${total - 1} reagiram` : top ? "obrigado pela reação" : ""}
      </span>
    </section>
  );
}
