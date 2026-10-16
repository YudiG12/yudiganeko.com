"use client";

import { useEffect, useRef } from "react";

/** Barra fina de progresso de leitura no topo (transform: sem layout shift, sem re-render). */
export default function ReadingProgress({ targetId = "gj-article" }: { targetId?: string }) {
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = document.getElementById(targetId);
      if (!el || !bar.current) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight * 0.6;
      const p = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 1;
      bar.current.style.transform = `scaleX(${p})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [targetId]);
  return (
    <div aria-hidden className="fixed inset-x-0 top-0 z-[60] h-[3px] bg-oatmeal/35">
      <div ref={bar} className="h-full origin-left scale-x-0 bg-truffle-trouble will-change-transform" />
    </div>
  );
}
