# Ganeko Journal

Artigos técnicos e interativos dentro do yudiganeko.com.

## Rotas

| Rota | O que é |
|------|---------|
| `/` (seção "Artigos", depois da hero) | carrossel com os artigos publicados (`featured`) |
| `/journal` | todos os artigos + filtro por categoria |
| `/journal/categoria/[slug]` | artigos de uma categoria |
| `/journal/artigos/[slug]` | leitura (índice lateral, progresso, reações, relacionados) |
| `/journal/busca?q=` | busca (também ⌘K / Ctrl K / `/` em qualquer página do Journal) |
| `/admin/artigos` | lista, publicar/despublicar, excluir, categorias |
| `/admin/artigos/novo` | cria um rascunho e abre o editor |
| `/admin/artigos/[id]` | editor (salvamento automático, prévia, publicar) |
| `/admin/componentes` | biblioteca de componentes interativos |
| `/api/journal/search`, `/api/journal/react` | busca e reações (públicos) |

## Login

Não existe um login novo. O `/admin` usa a mesma sessão do painel `/mentoria-admin`
(cookie `mf_admin`, criado por `/api/admin/login` do projeto mentoria-form, que já é servido neste domínio).
Mesma senha. Por isso o `SESSION_SECRET` daqui precisa ser **idêntico** ao do mentoria-form.

## Banco (Supabase `salariodev`, o mesmo do mentoria)

Migrations em `supabase/migrations/` (já aplicadas):

- `ganeko_journal_categories`, `ganeko_journal_articles` (conteúdo em JSON do Tiptap + `content_text` e `search` para busca em português),
  `ganeko_journal_components`, `ganeko_journal_reactions`, `ganeko_journal_upload_tickets`, `ganeko_journal_admin`.
- Bucket público `ganeko-journal` (imagens, até 10 MB; PNG, JPG, WebP, GIF, AVIF).

Segurança (mesmo modelo do `ganeko_roadmap`):

- RLS em tudo. O público só lê artigos com `status = 'published'`, as categorias e as reações deles.
- Toda escrita passa por funções `ganeko_journal_admin_*` (`security definer`) que exigem o `JOURNAL_WRITE_TOKEN`;
  o banco guarda só o SHA-256 dele. O servidor do Next só chama essas funções depois de validar o cookie do admin.
- Upload: o servidor libera um caminho por 10 min (ticket); o navegador sobe direto para esse caminho. Sem ticket, o Storage recusa.
- Rascunhos vazios há mais de 1 h são apagados quando a lista do admin abre.

## Componentes interativos

O HTML colado roda num `iframe` com `sandbox="allow-scripts"` (sem `allow-same-origin`) e `srcdoc`:
origem opaca, sem acesso a cookies, sessão, `localStorage`, ao DOM do site ou à navegação da página.
Há também uma CSP no documento: scripts/estilos inline ou via https (CDNs), e `connect-src 'none'`
(o componente não faz `fetch`/XHR/WebSocket). A única comunicação é a altura (auto) e os erros, via `postMessage`.

Cada artigo guarda a própria cópia do HTML: editar um componente na biblioteca não muda artigos já publicados.
Os três exemplos dos designs (porta AND, ciclo de uma instrução, CPU ↔ memória) estão em `supabase/seed/components/`
e já foram salvos na biblioteca.

## Variáveis de ambiente novas (projeto `yudiganeko-com` na Vercel, Production e Preview)

| Nome | Valor |
|------|-------|
| `JOURNAL_WRITE_TOKEN` | o token cujo SHA-256 está em `ganeko_journal_admin` |
| `SESSION_SECRET` | **exatamente** o mesmo do projeto mentoria-form (inclusive a quebra de linha no fim) |

A URL e a chave publishable do Supabase (salariodev) ficam no código (`lib/journal/supabase.ts`): são públicas por natureza.
`SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` só precisam existir se um dia quiser apontar para outro projeto.

Se trocar o `SESSION_SECRET` no mentoria-form, troque aqui também (senão o `/admin` do Journal pede login sem aceitar).

Para trocar o token: gere um novo, salve na Vercel e rode
`update public.ganeko_journal_admin set write_token_sha256 = encode(sha256(convert_to('<novo>', 'UTF8')), 'hex');`.
