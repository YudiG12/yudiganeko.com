import { common, createLowlight } from "lowlight";
import { toHtml } from "hast-util-to-html";
import CopyButton from "./copy-button";

export const lowlight = createLowlight(common);

export const LANGUAGE_LABELS: Record<string, string> = {
  plaintext: "texto",
  javascript: "JavaScript",
  typescript: "TypeScript",
  java: "Java",
  python: "Python",
  go: "Go",
  rust: "Rust",
  c: "C",
  cpp: "C++",
  csharp: "C#",
  kotlin: "Kotlin",
  sql: "SQL",
  bash: "Bash",
  shell: "Shell",
  json: "JSON",
  yaml: "YAML",
  xml: "HTML",
  css: "CSS",
  markdown: "Markdown",
};

export function highlight(code: string, language?: string | null) {
  try {
    const tree =
      language && lowlight.registered(language) ? lowlight.highlight(language, code) : lowlight.highlightAuto(code);
    return toHtml(tree);
  } catch {
    return code.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
  }
}

export default function CodeBlock({ code, language }: { code: string; language?: string | null }) {
  const label = (language && LANGUAGE_LABELS[language]) || language || "código";
  return (
    <figure className="gj-code group/code overflow-hidden rounded-2xl bg-[#1f2733] shadow-[0_10px_30px_-18px_rgba(15,22,30,0.6)]">
      <div className="flex h-9 items-center justify-between border-b border-white/[0.06] px-4">
        <span className="font-mono text-[11px] text-palladian/55">{label}</span>
        <CopyButton text={code} />
      </div>
      <pre className="overflow-x-auto px-4 py-4 font-mono text-[13px] leading-[1.7] text-[#d8d2c4] sm:px-5">
        <code dangerouslySetInnerHTML={{ __html: highlight(code, language) }} />
      </pre>
    </figure>
  );
}
