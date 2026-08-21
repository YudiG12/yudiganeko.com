# Media kit — credenciais e renovação

A página `/media-kit` puxa dados ao vivo de quatro fontes. Duas usam credencial
que não expira, duas usam token com prazo — e são essas que quebram sozinhas.

| Fonte | Env | Validade |
|---|---|---|
| YouTube Data API v3 — inscritos, views, top vídeos | `YOUTUBE_API_KEY`, `YOUTUBE_CHANNEL_ID` | não expira |
| YouTube Analytics API — demografia, engagement | `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REFRESH_TOKEN` | **7 dias** se o app OAuth estiver em *Testing*; indefinido se publicado |
| Instagram (IG Login) — perfil, posts, insights | `INSTAGRAM_ACCESS_TOKEN`, `INSTAGRAM_USER_ID` | **60 dias** |

Quando um token morre a página não quebra: os fetchers retornam `null` e a UI
cai pro estado "precisa de OAuth". Silencioso de propósito — por isso os erros
agora vão pro `console.error` com o status e o corpo da resposta, visíveis em
**Vercel → Logs**, filtrando por `[media-kit/`.

## Sintomas

| O que aparece na página | O que morreu |
|---|---|
| "Demographics need OAuth…" no lugar dos gráficos | YouTube Analytics **e** IG (o bloco só aparece quando os dois falham) |
| Tabela do YouTube mostra "Avg views per video" no lugar de "Engagement %" | YouTube Analytics |
| "Not connected. Set the env vars…" no painel do Instagram | Instagram |
| Inscritos/views/vídeos sumiram | `YOUTUBE_API_KEY` (raro — não expira) |

## Renovar o YouTube

```sh
set -a && . ~/youtube/99_dashboard/.env.local && set +a
node scripts/youtube-oauth.mjs
```

Sobe um listener em `http://localhost:8765/oauth/callback`, abre o consent e
imprime o refresh token novo. Essa URI **já está cadastrada** no OAuth client
do projeto `yudiganeko` — não precisa mexer em Credentials. Mudar a porta ou o
path quebra com `redirect_uri_mismatch`.

O único pré-requisito que ainda exige o console: **OAuth consent screen**
precisa estar em *In production*. Em *Testing*, o refresh token expira em
7 dias e isso volta a quebrar toda semana.

Se o Google devolver access token mas nenhum refresh token, é porque o consent
já estava ativo — revoga em [myaccount.google.com/permissions](https://myaccount.google.com/permissions)
e roda de novo.

O client id/secret vivem no `.env.local` do repo do dashboard
(`~/youtube/99_dashboard`), que é de onde esse setup nasceu. As envs da Vercel
são sensitive e não dão pra ler de volta.

## Renovar o Instagram

Token ainda vivo (rode antes dos 60 dias e é só isso):

```sh
INSTAGRAM_ACCESS_TOKEN=xxx node scripts/instagram-token.mjs refresh
```

Token já expirado — refresh não ressuscita, tem que refazer o consent:

```sh
INSTAGRAM_APP_ID=xxx node scripts/instagram-token.mjs url
# autoriza no browser; a pagina de retorno vai dar erro de conexao (esperado).
# copia o ?code= da barra de endereco, sem o "#_" do final.
INSTAGRAM_APP_ID=xxx INSTAGRAM_APP_SECRET=yyy \
  node scripts/instagram-token.mjs exchange <code>
```

`INSTAGRAM_APP_ID` / `INSTAGRAM_APP_SECRET` ficam no Meta app dashboard →
Instagram → API setup. A redirect URI default do script
(`https://localhost:8765/oauth/callback`) é a que já está cadastrada em
*Business Login Settings*. Ninguém escuta nela — Meta exige HTTPS no callback e
não há servidor HTTPS local, por isso o code é colado à mão.

Se o consent recusar, confere em **Roles → Roles** se `@ganekoyudi` ainda está
como *Instagram Tester* e se o convite continua aceito (Instagram →
Configurações → Apps e sites → Convites de tester).

Pra testar se o token atual está vivo:

```sh
INSTAGRAM_ACCESS_TOKEN=xxx node scripts/instagram-token.mjs check
```

## Gravar na Vercel

Env var nova só vale depois de um redeploy — a Vercel não reinjeta em
deployment que já existe.

```sh
vercel env rm  YOUTUBE_REFRESH_TOKEN production --yes
vercel env add YOUTUBE_REFRESH_TOKEN production
vercel --prod
```

Repita pro ambiente `preview` se quiser os dados nos previews.

Nota: as envs desse projeto estão marcadas como sensitive, então
`vercel env pull` devolve os valores vazios (`""`). Não dá pra ler de volta o
que está gravado — só sobrescrever.

## Cache

Os fetchers usam `next: { revalidate: 3600 }`. Depois do redeploy os dados
aparecem na hora (deploy novo = cache novo), mas uma troca de token sem deploy
levaria até 1h pra refletir.

## Histórico

Esse setup nasceu no repo do dashboard (`~/youtube/99_dashboard`), que tem os
scripts originais em `scripts/auth-youtube.ts`, `scripts/auth-instagram.ts` e
`scripts/refresh-instagram.ts`. Os scripts daqui são equivalentes e usam as
mesmas redirect URIs já cadastradas, pra não depender de um repo vizinho.
