"use client";

import { useEffect, useState, type ReactNode } from "react";

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`flex h-5 w-[34px] shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 ${
        checked ? "bg-blue-fantastic" : "bg-[#e3dccd]"
      }`}
    >
      <span
        className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ease-[cubic-bezier(.34,1.56,.64,1)] active:w-5 ${
          checked ? "translate-x-[14px]" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  size = "sm",
}: {
  value: T;
  options: { value: T; label: ReactNode; title?: string }[];
  onChange: (v: T) => void;
  size?: "sm" | "md";
}) {
  return (
    <div className="flex gap-0.5 rounded-[10px] bg-palladian p-[3px] shadow-[inset_0_0_0_1px_rgba(201,193,177,0.5)]">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          title={o.title}
          onClick={() => onChange(o.value)}
          className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-[7px] px-2.5 text-xs transition-all duration-200 active:scale-95 ${
            size === "md" ? "py-1.5" : "py-1"
          } ${value === o.value ? "bg-white text-blue-fantastic shadow-[0_1px_3px_rgba(44,59,77,0.12)]" : "text-blue-fantastic/65 hover:text-blue-fantastic"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Dialog({
  open,
  onClose,
  children,
  width = 780,
  label,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  width?: number;
  label: string;
}) {
  const [closing, setClosing] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  if (!open) return null;
  function close() {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      onClose();
    }, 130);
  }
  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto px-3 py-[8vh]" role="dialog" aria-modal="true" aria-label={label}>
      <button
        type="button"
        aria-label="Fechar"
        onClick={close}
        className={`fixed inset-0 bg-[rgba(15,22,30,0.32)] backdrop-blur-[6px] ${closing ? "opacity-0 transition-opacity duration-150" : "gj-fade"}`}
      />
      <div
        style={{ maxWidth: width }}
        className={`relative w-full rounded-3xl bg-white shadow-[0_0_0_1px_rgba(201,193,177,0.6),0_40px_80px_-24px_rgba(15,22,30,0.45)] ${
          closing ? "scale-[0.97] opacity-0 transition-all duration-150" : "gj-pop"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

export function Toast({ message, tone = "ok", onDone }: { message: string; tone?: "ok" | "error"; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="fixed bottom-8 left-1/2 z-[100] -translate-x-1/2">
      <div className="gj-rise flex items-center gap-2.5 rounded-xl bg-blue-fantastic py-2.5 pl-3 pr-4 shadow-[0_16px_32px_-12px_rgba(15,22,30,0.55)]">
        <span className={`flex h-5 w-5 items-center justify-center rounded-full ${tone === "ok" ? "bg-[#2f8a5b]" : "bg-[#cf4238]"}`}>
          <span className="text-[11px] font-bold text-white">{tone === "ok" ? "✓" : "!"}</span>
        </span>
        <span className="text-xs text-white">{message}</span>
      </div>
    </div>
  );
}

export const inputCls =
  "w-full rounded-xl px-3.5 text-[13px] text-blue-fantastic outline-none ring-1 ring-oatmeal/90 transition placeholder:text-blue-fantastic/35 focus:ring-[1.5px] focus:ring-blue-fantastic focus:shadow-[0_0_0_4px_rgba(44,59,77,0.06)]";
