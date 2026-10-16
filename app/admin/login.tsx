"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

// Usa o login que já existe no domínio (/api/admin/login, projeto mentoria-form) — mesma senha e mesmo cookie.
export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.refresh();
        return;
      }
      const json = await res.json().catch(() => ({}));
      setError(json.error || "Não foi possível entrar.");
      setShake((n) => n + 1);
    } catch {
      setError("Sem conexão.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={submit} className="gj-rise flex w-full max-w-[360px] flex-col gap-5">
        <Image src="/logo.png" alt="Yudi Ganeko" width={871} height={286} className="h-9 w-auto self-start" priority />
        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-bold">Ganeko Journal</h1>
          <p className="text-[13px] text-blue-fantastic/60">Entre com a senha do admin.</p>
        </div>
        <input
          key={shake}
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="senha"
          className={`h-11 rounded-xl px-3.5 text-sm outline-none ring-1 ring-oatmeal/90 transition focus:ring-[1.5px] focus:ring-blue-fantastic focus:shadow-[0_0_0_4px_rgba(44,59,77,0.06)] ${
            shake ? "animate-[gj-shake_0.35s]" : ""
          }`}
        />
        {error && <p className="-mt-2 text-xs text-[#cf4238]">{error}</p>}
        <button
          disabled={loading || !password}
          className="h-11 rounded-xl bg-blue-fantastic text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_4px_10px_-4px_rgba(44,59,77,0.5)] transition active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
