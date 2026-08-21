#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// Mints a fresh YOUTUBE_REFRESH_TOKEN for the media kit's Analytics calls.
//
// Google only hands out a refresh token when the consent screen is forced
// (`prompt=consent`) on an offline-access request — a plain re-auth silently
// returns an access token only, which is why a "successful" login can still
// leave you without the value you came for.
//
// Usage:
//   YOUTUBE_CLIENT_ID=... YOUTUBE_CLIENT_SECRET=... node scripts/youtube-oauth.mjs
//
// The redirect URI below is already registered on the client, so no Google
// console changes are needed — only the consent click in the browser.
// ─────────────────────────────────────────────────────────────────────────────

import http from "node:http";
import { spawn } from "node:child_process";

// Port and path are not arbitrary: this exact URI is already registered under
// "Authorized redirect URIs" on the yudiganeko OAuth client, so the flow works
// without touching the Google console. Changing either breaks with
// redirect_uri_mismatch.
const PORT = 8765;
const REDIRECT = `http://localhost:${PORT}/oauth/callback`;

// Non-monetary channel analytics is all the media kit reads: viewerPercentage
// by ageGroup/gender, views by country, and the 30-day engagement aggregates.
// youtube.readonly matches the consent this channel already granted before.
const SCOPE = [
  "https://www.googleapis.com/auth/yt-analytics.readonly",
  "https://www.googleapis.com/auth/youtube.readonly",
].join(" ");

const clientId = process.env.YOUTUBE_CLIENT_ID;
const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error(
    "Faltando YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET no ambiente.\n" +
      "Pegue os dois em console.cloud.google.com → APIs & Services → Credentials\n" +
      "e rode:\n\n" +
      "  YOUTUBE_CLIENT_ID=xxx YOUTUBE_CLIENT_SECRET=yyy node scripts/youtube-oauth.mjs\n",
  );
  process.exit(1);
}

const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
authUrl.searchParams.set("client_id", clientId);
authUrl.searchParams.set("redirect_uri", REDIRECT);
authUrl.searchParams.set("response_type", "code");
authUrl.searchParams.set("scope", SCOPE);
authUrl.searchParams.set("access_type", "offline");
authUrl.searchParams.set("prompt", "consent");

async function exchange(code) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: REDIRECT,
      grant_type: "authorization_code",
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(data)}`);
  return data;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (url.pathname !== "/oauth/callback") {
    res.writeHead(404).end();
    return;
  }

  const err = url.searchParams.get("error");
  const code = url.searchParams.get("code");

  if (err || !code) {
    res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(`Consent negado: ${err ?? "sem code"}`);
    console.error(`\n✗ Consent negado: ${err ?? "sem code na resposta"}`);
    server.close();
    process.exit(1);
  }

  try {
    const tok = await exchange(code);
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end("<h1>Pronto.</h1><p>Pode fechar essa aba e voltar pro terminal.</p>");

    if (!tok.refresh_token) {
      console.error(
        "\n✗ Google devolveu access_token mas NAO refresh_token.\n" +
          "  Normalmente significa que o app ja tinha consent ativo. Revogue em\n" +
          "  myaccount.google.com/permissions e rode de novo.",
      );
      server.close();
      process.exit(1);
    }

    console.log("\n✓ Refresh token novo:\n");
    console.log(tok.refresh_token);
    console.log("\nGrava na Vercel (Production + Preview) e redeploya:\n");
    console.log("  vercel env rm YOUTUBE_REFRESH_TOKEN production --yes");
    console.log("  vercel env add YOUTUBE_REFRESH_TOKEN production");
    console.log("  vercel --prod\n");
    console.log(
      "Se o OAuth consent screen ainda estiver em Testing, esse token morre\n" +
        "em 7 dias. Publica o app antes (OAuth consent screen → Publish app).\n",
    );
  } catch (e) {
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Falhou na troca do code. Veja o terminal.");
    console.error(`\n✗ Troca do code falhou: ${e.message}`);
    server.close();
    process.exit(1);
  }

  server.close();
  process.exit(0);
});

server.listen(PORT, () => {
  console.log(`Escutando em ${REDIRECT}\n`);
  console.log("Abrindo o consent no browser. Se nao abrir, cola essa URL:\n");
  console.log(authUrl.toString() + "\n");
  spawn("open", [authUrl.toString()], { stdio: "ignore", detached: true }).unref();
});
