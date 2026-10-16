import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";

/**
 * Reaproveita a sessão do admin que já existe no domínio (painel /mentoria-admin):
 * cookie HttpOnly `mf_admin` assinado com HMAC usando SESSION_SECRET.
 * O login continua sendo o de /api/admin/login (projeto mentoria-form, servido neste domínio).
 */
export const ADMIN_COOKIE = "mf_admin";

function sign(payload: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(payload).digest("base64url");
}

export function verifyAdminToken(token: string | undefined, secret: string | undefined) {
  if (!token || !secret) return false;
  const [b64, sig] = token.split(".");
  if (!b64 || !sig) return false;
  const exp = Buffer.from(b64, "base64url").toString();
  const expected = sign(exp, secret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  const ts = Number(exp);
  return Number.isFinite(ts) && Date.now() < ts;
}

export async function isAdmin() {
  const store = await cookies();
  return verifyAdminToken(store.get(ADMIN_COOKIE)?.value, process.env.SESSION_SECRET);
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Sessão expirada. Entre de novo.");
  }
}

/** Use no começo de toda server action administrativa. */
export async function requireAdmin() {
  if (!(await isAdmin())) throw new UnauthorizedError();
}
