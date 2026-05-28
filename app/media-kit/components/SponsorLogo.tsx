"use client";

import { useState } from "react";

type Size = "sm" | "md" | "lg" | "xl";

const SIZE_CLASSES: Record<Size, { box: string; text: string; pad: string }> = {
  sm: { box: "h-7 w-7", text: "text-[10px]", pad: "p-0.5" },
  md: { box: "h-9 w-9", text: "text-[11px]", pad: "p-1" },
  lg: { box: "h-14 w-14", text: "text-[14px]", pad: "p-1.5" },
  xl: { box: "h-20 w-20", text: "text-[18px]", pad: "p-2.5" },
};

// Renders a brand logo from Google's public favicon CDN when we have a domain;
// gracefully falls back to a coloured initials puck when the image fails (no
// domain, 404, blocked).
export default function SponsorLogo({
  brand,
  domain,
  logoSrc,
  color,
  size = "md",
}: {
  brand: string;
  domain?: string;
  logoSrc?: string;
  color: string;
  size?: Size;
}) {
  const [failed, setFailed] = useState(false);
  const cls = SIZE_CLASSES[size];

  // Prefer a curated local image; fall back to the favicon CDN; fall back to
  // a coloured initials puck.
  const src = !failed
    ? logoSrc ??
      (domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : null)
    : null;

  if (!src) {
    return (
      <span
        aria-label={brand}
        className={`inline-flex shrink-0 items-center justify-center rounded-full font-mono font-bold uppercase ${cls.box} ${cls.text}`}
        style={{ background: color, color: "#F9F7F4" }}
      >
        {initials(brand)}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-2xl ${cls.box}`}
      aria-label={brand}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={brand}
        className="h-full w-full object-cover"
        onError={() => setFailed(true)}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    </span>
  );
}

function initials(brand: string): string {
  // Take first letter of up to two words for natural display.
  const words = brand.replace(/[^A-Z0-9 ]/gi, "").trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  const letters = brand.replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(0, 2);
  return letters || "?";
}
