import type { Metadata } from "next";
import { isAdmin } from "@/lib/journal/auth";
import AdminLogin from "./login";

export const metadata: Metadata = {
  title: "Admin · Ganeko Journal",
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-dynamic";

// Área administrativa: mesma sessão do painel /mentoria-admin (cookie mf_admin).
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const authed = await isAdmin();
  return <div className="gj-motion min-h-screen bg-white font-mono tracking-wide text-blue-fantastic">{authed ? children : <AdminLogin />}</div>;
}
