#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// Manages INSTAGRAM_ACCESS_TOKEN for the media kit (Instagram API with
// Instagram Login — graph.instagram.com, no Facebook Page in the path).
//
// Long-lived tokens last 60 days. `refresh` extends one that is still alive;
// once it has lapsed the only way back is the full consent flow (`url` then
// `exchange`), because Meta will not renew a dead token.
//
// Commands:
//   node scripts/instagram-token.mjs refresh          # extend a live token
//   node scripts/instagram-token.mjs url              # print the consent URL
//   node scripts/instagram-token.mjs exchange <code>  # code -> 60-day token
//   node scripts/instagram-token.mjs check            # who is this token, when does it die
//
// Env: INSTAGRAM_APP_ID, INSTAGRAM_APP_SECRET, INSTAGRAM_REDIRECT_URI,
//      INSTAGRAM_ACCESS_TOKEN (for refresh/check).
// ─────────────────────────────────────────────────────────────────────────────

const GRAPH = "https://graph.instagram.com";

const appId = process.env.INSTAGRAM_APP_ID;
const appSecret = process.env.INSTAGRAM_APP_SECRET;
// Meta requires HTTPS on the callback and there is no local HTTPS server here,
// so nothing ever listens on this URI — the browser lands on a dead page and
// you copy the ?code= out of the address bar. It is already registered under
// the Instagram product's "Business Login Settings", so leave it alone.
const redirectUri =
  process.env.INSTAGRAM_REDIRECT_URI ?? "https://localhost:8765/oauth/callback";
const currentToken = process.env.INSTAGRAM_ACCESS_TOKEN;

const [, , cmd, arg] = process.argv;

function die(msg) {
  console.error(`\n✗ ${msg}\n`);
  process.exit(1);
}

function need(value, name, where) {
  if (!value) die(`Faltando ${name}.\n  ${where}`);
  return value;
}

function days(seconds) {
  return Math.round(seconds / 86400);
}

function report(token, expiresIn) {
  console.log("\n✓ Token novo:\n");
  console.log(token);
  if (expiresIn) console.log(`\nExpira em ~${days(expiresIn)} dias.`);
  console.log("\nGrava na Vercel (Production + Preview) e redeploya:\n");
  console.log("  vercel env rm INSTAGRAM_ACCESS_TOKEN production --yes");
  console.log("  vercel env add INSTAGRAM_ACCESS_TOKEN production");
  console.log("  vercel --prod\n");
}

async function get(url) {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) die(`${res.status} — ${JSON.stringify(data)}`);
  return data;
}

// ── refresh — only works while the token is still valid and >24h old ────────
async function refresh() {
  need(currentToken, "INSTAGRAM_ACCESS_TOKEN", "Exporta o token atual antes de rodar.");
  const url = new URL(`${GRAPH}/refresh_access_token`);
  url.searchParams.set("grant_type", "ig_refresh_token");
  url.searchParams.set("access_token", currentToken);

  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) {
    console.error(`\n✗ Refresh recusado: ${res.status} — ${JSON.stringify(data)}`);
    console.error(
      "\nSe o token ja expirou (60 dias), refresh nao resolve. Roda o flow completo:\n" +
        "  node scripts/instagram-token.mjs url\n",
    );
    process.exit(1);
  }
  report(data.access_token, data.expires_in);
}

// ── url — consent screen for the full re-auth ───────────────────────────────
function consentUrl() {
  need(appId, "INSTAGRAM_APP_ID", "Meta app dashboard → Instagram → API setup.");
  const url = new URL("https://www.instagram.com/oauth/authorize");
  url.searchParams.set("client_id", appId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set(
    "scope",
    "instagram_business_basic,instagram_business_manage_insights",
  );

  console.log("\nAbre no browser e autoriza. A pagina de retorno vai dar erro de\n" +
    "conexao (esperado — ninguem escuta nesse HTTPS). Copia o ?code= da barra\n" +
    "de endereco, sem o #_ do final:\n");
  console.log(url.toString() + "\n");
  console.log("Depois:\n");
  console.log("  node scripts/instagram-token.mjs exchange <code>\n");
}

// ── exchange — code -> short-lived -> long-lived ────────────────────────────
async function exchange(rawCode) {
  if (!rawCode) die("Passa o code: node scripts/instagram-token.mjs exchange <code>");
  need(appId, "INSTAGRAM_APP_ID", "Meta app dashboard → Instagram → API setup.");
  need(appSecret, "INSTAGRAM_APP_SECRET", "Meta app dashboard → Instagram → API setup.");

  // Meta appends "#_" to the code in the redirect URL — it is not part of it.
  const code = rawCode.replace(/#_$/, "");

  const shortRes = await fetch("https://api.instagram.com/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code,
    }),
  });
  const short = await shortRes.json();
  if (!shortRes.ok) {
    die(
      `Troca do code falhou: ${shortRes.status} — ${JSON.stringify(short)}\n` +
        "  Codes valem uma unica vez e expiram rapido. Gera outro com `url`.",
    );
  }

  const longUrl = new URL(`${GRAPH}/access_token`);
  longUrl.searchParams.set("grant_type", "ig_exchange_token");
  longUrl.searchParams.set("client_secret", appSecret);
  longUrl.searchParams.set("access_token", short.access_token);
  const long = await get(longUrl);

  console.log(`\nuser_id: ${short.user_id}  ← confere com INSTAGRAM_USER_ID`);
  report(long.access_token, long.expires_in);
}

// ── check — is the current token alive, and for how long ────────────────────
async function check() {
  need(currentToken, "INSTAGRAM_ACCESS_TOKEN", "Exporta o token que quer testar.");
  const url = new URL(`${GRAPH}/me`);
  url.searchParams.set("fields", "id,username,followers_count");
  url.searchParams.set("access_token", currentToken);

  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) {
    console.error(`\n✗ Token morto: ${res.status} — ${JSON.stringify(data)}\n`);
    process.exit(1);
  }
  console.log(
    `\n✓ Token vivo — @${data.username} (id ${data.id}), ${data.followers_count} seguidores\n`,
  );
}

const commands = { refresh, url: consentUrl, exchange, check };
const run = commands[cmd];

if (!run) {
  console.error(
    "\nComandos: refresh | url | exchange <code> | check\n\n" +
      "  refresh          extende um token ainda vivo (+60 dias)\n" +
      "  url              imprime a URL de consent pro flow completo\n" +
      "  exchange <code>  troca o code do redirect por um token de 60 dias\n" +
      "  check            testa se o token atual ainda funciona\n",
  );
  process.exit(1);
}

await run(arg);
