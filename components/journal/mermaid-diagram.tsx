"use client";

import { useEffect, useId, useState } from "react";

/** Diagrama em sintaxe Mermaid, renderizado só no navegador (lib carregada sob demanda). */
export default function MermaidDiagram({ code }: { code: string }) {
  const id = useId().replace(/[^a-z0-9]/gi, "");
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: "base",
          fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
          themeVariables: {
            primaryColor: "#ffffff",
            primaryBorderColor: "#2c3b4d",
            primaryTextColor: "#2c3b4d",
            lineColor: "#a35139",
            secondaryColor: "#f9f7f4",
            tertiaryColor: "#fcfbf8",
            fontSize: "14px",
          },
        });
        const { svg } = await mermaid.render(`mm${id}`, code);
        if (!cancelled) {
          setSvg(svg);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message.split("\n")[0] : "Diagrama inválido");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, id]);

  if (error) {
    return (
      <div className="rounded-2xl bg-[#fcfbf8] p-5 font-mono text-xs text-truffle-trouble ring-1 ring-oatmeal/55">
        Diagrama com erro: {error}
      </div>
    );
  }
  return (
    <div
      className={`flex min-h-24 justify-center overflow-x-auto rounded-[20px] bg-[#fcfbf8] p-6 ring-1 ring-oatmeal/55 transition-opacity duration-300 [&_svg]:h-auto [&_svg]:max-w-full ${
        svg ? "opacity-100" : "opacity-0"
      }`}
      // SVG gerado pelo mermaid com securityLevel "strict" (sanitizado).
      dangerouslySetInnerHTML={{ __html: svg ?? "" }}
    />
  );
}
