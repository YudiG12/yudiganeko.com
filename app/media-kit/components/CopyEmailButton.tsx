"use client";

import { useState } from "react";

// Email + copy-to-clipboard button. Shows the address as the primary affordance,
// with a small "copy" button that flashes "copied" on success.
export default function CopyEmailButton({
  email,
  copyLabel = "copy",
  copiedLabel = "copied",
  compact = false,
}: {
  email: string;
  copyLabel?: string;
  copiedLabel?: string;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fallback: select the input — old browsers, http contexts.
      const ta = document.createElement("textarea");
      ta.value = email;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      } catch {}
      document.body.removeChild(ta);
    }
  }

  // Compact = smaller padding/font for inline use (e.g. inside the hero).
  // Both variants stay within their container — `max-w-full` + `truncate` on
  // the email link keep it from breaking the layout on narrow mobile screens.
  const link = compact
    ? "px-3 py-2 text-[11.5px]"
    : "px-5 py-3.5 text-[14px]";
  const action = compact
    ? "px-2.5 py-2 text-[10px]"
    : "px-4 py-3.5 text-[12.5px]";

  return (
    <div
      className={`inline-flex max-w-full items-stretch overflow-hidden rounded-full bg-flame text-indigo ${
        compact ? "" : "mt-7"
      }`}
    >
      <a
        href={`mailto:${email}`}
        className={`flex min-w-0 items-center truncate font-mono tracking-tight transition-opacity hover:opacity-90 ${link}`}
      >
        {email}
      </a>
      <button
        type="button"
        onClick={copy}
        aria-label={copyLabel}
        className={`flex shrink-0 items-center gap-1.5 border-l border-indigo/15 font-semibold uppercase tracking-[0.18em] transition-colors hover:bg-indigo hover:text-flame ${action}`}
      >
        {copied ? (
          <>
            <CheckIcon />
            {copiedLabel}
          </>
        ) : (
          <>
            <CopyIcon />
            {copyLabel}
          </>
        )}
      </button>
    </div>
  );
}

function CopyIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
