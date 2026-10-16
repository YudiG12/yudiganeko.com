"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";

export default function AdminBar({ children, center }: { children?: ReactNode; center?: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const nav = [
    { href: "/admin/artigos", label: "artigos" },
    { href: "/admin/componentes", label: "componentes" },
  ];
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b border-oatmeal/50 bg-white/85 px-4 backdrop-blur-md sm:px-6">
      <div className="flex min-w-0 items-center gap-3.5 sm:w-[420px]">
        <Link href="/admin/artigos" className="shrink-0 transition-opacity hover:opacity-80">
          <Image src="/logo.png" alt="Yudi Ganeko" width={871} height={286} className="h-[26px] w-auto" />
        </Link>
        <span className="text-sm text-oatmeal">/</span>
        <nav className="flex min-w-0 items-center gap-1">
          {nav.map((n) => {
            const active = path.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`rounded-lg px-2 py-1 text-[13px] transition-colors ${
                  active ? "text-blue-fantastic" : "text-blue-fantastic/55 hover:text-blue-fantastic"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
      </div>
      {center}
      <div className="flex items-center justify-end gap-2.5 sm:w-[420px]">
        {children ?? (
          <>
            <a href="/journal" target="_blank" className="hidden text-[13px] text-blue-fantastic/60 hover:text-blue-fantastic sm:inline">
              ver site ↗
            </a>
            <button
              type="button"
              onClick={async () => {
                await fetch("/api/admin/logout", { method: "POST" }).catch(() => {});
                router.refresh();
              }}
              className="rounded-lg px-2 py-1 text-[13px] text-blue-fantastic/55 hover:text-blue-fantastic"
            >
              sair
            </button>
          </>
        )}
      </div>
    </header>
  );
}
