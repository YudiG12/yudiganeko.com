"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createArticleAction } from "../../actions";

export default function NewArticle() {
  const router = useRouter();
  const started = useRef(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    createArticleAction({}).then((r) => {
      if (r.ok) router.replace(`/admin/artigos/${r.data.id}`);
      else setError(r.error);
    });
  }, [router]);
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3">
      {error ? (
        <>
          <p className="text-sm text-[#cf4238]">{error}</p>
          <Link href="/admin/artigos" className="text-xs text-truffle-trouble underline underline-offset-4">
            voltar
          </Link>
        </>
      ) : (
        <>
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-oatmeal border-t-truffle-trouble" />
          <p className="text-xs text-blue-fantastic/55">Abrindo um rascunho novo…</p>
        </>
      )}
    </main>
  );
}
