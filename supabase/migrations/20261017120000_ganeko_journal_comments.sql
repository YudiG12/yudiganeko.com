-- Ganeko Journal: comentários dos leitores (só nome, sem login), respostas de um nível e reações por comentário.
-- Leitura: o servidor do Next lê as colunas públicas (o hash do IP nunca sai do banco).
-- Escrita: só pelo servidor do Next, com o JOURNAL_WRITE_TOKEN — é ele que calcula o hash do IP e diz se quem
-- escreve é o autor (cookie do admin). Assim ninguém comenta direto pela API pulando o limite de frequência.

create table public.ganeko_journal_comments (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.ganeko_journal_articles (id) on delete cascade,
  parent_id uuid references public.ganeko_journal_comments (id) on delete cascade,
  author_name text not null check (char_length(btrim(author_name)) between 1 and 60),
  is_author boolean not null default false,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  ip_hash text not null check (ip_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now()
);
create index ganeko_journal_comments_article_idx on public.ganeko_journal_comments (article_id, created_at desc);
create index ganeko_journal_comments_parent_idx on public.ganeko_journal_comments (parent_id);
create index ganeko_journal_comments_ip_idx on public.ganeko_journal_comments (ip_hash, created_at desc);

create table public.ganeko_journal_comment_reactions (
  comment_id uuid not null references public.ganeko_journal_comments (id) on delete cascade,
  emoji text not null check (emoji in ('👍', '😂', '🤯', '❤️', '🔥', '👏')),
  count int not null default 0 check (count >= 0),
  primary key (comment_id, emoji)
);

alter table public.ganeko_journal_comments enable row level security;
alter table public.ganeko_journal_comment_reactions enable row level security;

revoke all on table public.ganeko_journal_comments from anon, authenticated;
revoke all on table public.ganeko_journal_comment_reactions from anon, authenticated;

-- Só as colunas públicas (sem ip_hash).
grant select (id, article_id, parent_id, author_name, is_author, body, created_at)
  on table public.ganeko_journal_comments to anon, authenticated;
grant select on table public.ganeko_journal_comment_reactions to anon, authenticated;

create policy "Public read comments of published articles" on public.ganeko_journal_comments
  for select to anon, authenticated using (
    exists (select 1 from public.ganeko_journal_articles a where a.id = article_id and a.status = 'published')
  );
create policy "Public read comment reactions of published articles" on public.ganeko_journal_comment_reactions
  for select to anon, authenticated using (
    exists (
      select 1 from public.ganeko_journal_comments c
      join public.ganeko_journal_articles a on a.id = c.article_id
      where c.id = comment_id and a.status = 'published'
    )
  );

-- Novo comentário (ou resposta). Respostas ficam sempre no primeiro nível: responder a uma resposta
-- pendura no comentário de cima. Limites: 1 a cada 15 s e 8 a cada 10 min por IP (o autor não tem limite).
create function public.ganeko_journal_srv_add_comment(
  p_token text,
  p_article_id uuid,
  p_parent_id uuid,
  p_name text,
  p_body text,
  p_ip_hash text,
  p_is_author boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_parent uuid := p_parent_id;
  v_row public.ganeko_journal_comments;
begin
  perform public.ganeko_journal_guard(p_token);
  if not exists (
    select 1 from public.ganeko_journal_articles where id = p_article_id and status = 'published'
  ) then
    raise exception 'not found' using errcode = 'P0002';
  end if;
  if v_parent is not null then
    select coalesce(c.parent_id, c.id) into v_parent
    from public.ganeko_journal_comments c
    where c.id = p_parent_id and c.article_id = p_article_id;
    if v_parent is null then
      raise exception 'parent not found' using errcode = 'P0002';
    end if;
  end if;
  if not coalesce(p_is_author, false) then
    if exists (
      select 1 from public.ganeko_journal_comments
      where ip_hash = p_ip_hash and created_at > now() - interval '15 seconds'
    ) or (
      select count(*) from public.ganeko_journal_comments
      where ip_hash = p_ip_hash and created_at > now() - interval '10 minutes'
    ) >= 8 then
      raise exception 'rate limited' using errcode = 'P0001', hint = 'rate_limited';
    end if;
  end if;
  insert into public.ganeko_journal_comments (article_id, parent_id, author_name, is_author, body, ip_hash)
  values (p_article_id, v_parent, btrim(p_name), coalesce(p_is_author, false), btrim(p_body), p_ip_hash)
  returning * into v_row;
  return jsonb_build_object(
    'id', v_row.id, 'article_id', v_row.article_id, 'parent_id', v_row.parent_id,
    'author_name', v_row.author_name, 'is_author', v_row.is_author, 'body', v_row.body,
    'created_at', v_row.created_at
  );
end;
$$;

create function public.ganeko_journal_admin_delete_comment(p_token text, p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.ganeko_journal_guard(p_token);
  delete from public.ganeko_journal_comments where id = p_id;
end;
$$;

-- Reação anônima a um comentário (mesmo modelo das reações do artigo).
create function public.ganeko_journal_comment_react(p_comment_id uuid, p_emoji text, p_delta int)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare v_count int;
begin
  if p_delta not in (-1, 1) then
    raise exception 'invalid delta' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.ganeko_journal_comments c
    join public.ganeko_journal_articles a on a.id = c.article_id
    where c.id = p_comment_id and a.status = 'published'
  ) then
    raise exception 'not found' using errcode = 'P0002';
  end if;
  insert into public.ganeko_journal_comment_reactions (comment_id, emoji, count)
  values (p_comment_id, p_emoji, greatest(p_delta, 0))
  on conflict (comment_id, emoji) do update set count = greatest(0, public.ganeko_journal_comment_reactions.count + p_delta)
  returning count into v_count;
  return v_count;
end;
$$;

revoke execute on function public.ganeko_journal_srv_add_comment(text, uuid, uuid, text, text, text, boolean) from public, authenticated;
revoke execute on function public.ganeko_journal_admin_delete_comment(text, uuid) from public, authenticated;
revoke execute on function public.ganeko_journal_comment_react(uuid, text, int) from public, authenticated;

grant execute on function public.ganeko_journal_srv_add_comment(text, uuid, uuid, text, text, text, boolean) to anon;
grant execute on function public.ganeko_journal_admin_delete_comment(text, uuid) to anon;
grant execute on function public.ganeko_journal_comment_react(uuid, text, int) to anon;
