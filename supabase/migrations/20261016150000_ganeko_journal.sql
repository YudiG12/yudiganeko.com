-- Ganeko Journal: articles, categories, interactive components, reactions and image uploads.
-- Same model as ganeko_roadmap_site: anyone can read what is published; every write goes through
-- the security definer functions below, which require the Journal write token (held by the
-- Next.js server as JOURNAL_WRITE_TOKEN; only its SHA-256 is stored here).

create table public.ganeko_journal_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  name text not null check (char_length(name) between 1 and 60),
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table public.ganeko_journal_articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 120),
  title text not null default '' check (char_length(title) <= 200),
  description text not null default '' check (char_length(description) <= 300),
  category_id uuid references public.ganeko_journal_categories (id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  content jsonb not null default '{"type":"doc","content":[]}'::jsonb,
  content_text text not null default '' check (char_length(content_text) <= 400000),
  cover_url text check (cover_url is null or (char_length(cover_url) <= 2048 and cover_url ~* '^https://')),
  seo_title text not null default '' check (char_length(seo_title) <= 200),
  seo_description text not null default '' check (char_length(seo_description) <= 300),
  reading_minutes int not null default 1 check (reading_minutes between 1 and 600),
  featured boolean not null default true,
  allow_reactions boolean not null default true,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search tsvector generated always as (
    setweight(to_tsvector('portuguese', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('portuguese', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('portuguese', coalesce(content_text, '')), 'C')
  ) stored
);
create index ganeko_journal_articles_search_idx on public.ganeko_journal_articles using gin (search);
create index ganeko_journal_articles_published_idx on public.ganeko_journal_articles (status, published_at desc);
create index ganeko_journal_articles_category_idx on public.ganeko_journal_articles (category_id);

-- Library of interactive components (HTML + CSS + JS pasted from an external AI).
-- Articles keep their own copy of the HTML, so editing a component never changes a published article.
create table public.ganeko_journal_components (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  html text not null check (char_length(html) <= 500000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ganeko_journal_reactions (
  article_id uuid not null references public.ganeko_journal_articles (id) on delete cascade,
  emoji text not null check (emoji in ('🤯', '🔥', '👏', '❤️', '🤔')),
  count int not null default 0 check (count >= 0),
  primary key (article_id, emoji)
);

-- Short-lived upload paths. The storage policy only accepts an upload to a path issued here.
create table public.ganeko_journal_upload_tickets (
  path text primary key,
  expires_at timestamptz not null
);

-- Single row with the hash of the write token. No grants and no policies: unreadable through the API.
create table public.ganeko_journal_admin (
  id boolean primary key default true check (id),
  write_token_sha256 text not null check (write_token_sha256 ~ '^[0-9a-f]{64}$')
);

alter table public.ganeko_journal_categories enable row level security;
alter table public.ganeko_journal_articles enable row level security;
alter table public.ganeko_journal_components enable row level security;
alter table public.ganeko_journal_reactions enable row level security;
alter table public.ganeko_journal_upload_tickets enable row level security;
alter table public.ganeko_journal_admin enable row level security;

revoke all on table public.ganeko_journal_categories from anon, authenticated;
revoke all on table public.ganeko_journal_articles from anon, authenticated;
revoke all on table public.ganeko_journal_components from anon, authenticated;
revoke all on table public.ganeko_journal_reactions from anon, authenticated;
revoke all on table public.ganeko_journal_upload_tickets from anon, authenticated;
revoke all on table public.ganeko_journal_admin from anon, authenticated;

grant select on table public.ganeko_journal_categories to anon, authenticated;
grant select on table public.ganeko_journal_articles to anon, authenticated;
grant select on table public.ganeko_journal_reactions to anon, authenticated;

create policy "Public read categories" on public.ganeko_journal_categories
  for select to anon, authenticated using (true);
create policy "Public read published articles" on public.ganeko_journal_articles
  for select to anon, authenticated using (status = 'published');
create policy "Public read reactions of published articles" on public.ganeko_journal_reactions
  for select to anon, authenticated using (
    exists (select 1 from public.ganeko_journal_articles a where a.id = article_id and a.status = 'published')
  );

-- Token check (internal: not callable through the API).
create function public.ganeko_journal_ok(p_token text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.ganeko_journal_admin a
    where p_token is not null
      and a.write_token_sha256 = encode(sha256(convert_to(p_token, 'UTF8')), 'hex')
  );
$$;
revoke execute on function public.ganeko_journal_ok(text) from public, anon, authenticated;

create function public.ganeko_journal_guard(p_token text)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.ganeko_journal_ok(p_token) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
end;
$$;
revoke execute on function public.ganeko_journal_guard(text) from public, anon, authenticated;

create function public.ganeko_journal_reading_minutes(p_text text)
returns int
language sql
immutable
set search_path = ''
as $$
  select greatest(1, least(600, ceil(coalesce(array_length(regexp_split_to_array(btrim(coalesce(p_text, '')), '\s+'), 1), 0) / 200.0)::int));
$$;

-- ── Articles ─────────────────────────────────────────────────────────────

create function public.ganeko_journal_admin_list_articles(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.ganeko_journal_guard(p_token);
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', a.id, 'slug', a.slug, 'title', a.title, 'description', a.description,
      'category_id', a.category_id, 'status', a.status, 'cover_url', a.cover_url,
      'reading_minutes', a.reading_minutes, 'published_at', a.published_at,
      'updated_at', a.updated_at, 'created_at', a.created_at,
      'reactions', coalesce((select sum(r.count) from public.ganeko_journal_reactions r where r.article_id = a.id), 0)
    ) order by a.updated_at desc)
    from public.ganeko_journal_articles a
  ), '[]'::jsonb);
end;
$$;

create function public.ganeko_journal_admin_get_article(p_token text, p_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare r jsonb;
begin
  perform public.ganeko_journal_guard(p_token);
  select to_jsonb(a) - 'search' into r from public.ganeko_journal_articles a where a.id = p_id;
  return r;
end;
$$;

create function public.ganeko_journal_admin_create_article(p_token text, p_slug text, p_title text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare v_id uuid;
begin
  perform public.ganeko_journal_guard(p_token);
  insert into public.ganeko_journal_articles (slug, title) values (p_slug, coalesce(p_title, ''))
  returning id into v_id;
  return v_id;
end;
$$;

-- Only the keys present in p_patch change. Returns the new updated_at.
create function public.ganeko_journal_admin_update_article(p_token text, p_id uuid, p_patch jsonb)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare v_updated timestamptz;
begin
  perform public.ganeko_journal_guard(p_token);
  if jsonb_typeof(p_patch) is distinct from 'object' then
    raise exception 'invalid patch' using errcode = '22023';
  end if;
  update public.ganeko_journal_articles a set
    slug = case when p_patch ? 'slug' then p_patch->>'slug' else a.slug end,
    title = case when p_patch ? 'title' then coalesce(p_patch->>'title', '') else a.title end,
    description = case when p_patch ? 'description' then coalesce(p_patch->>'description', '') else a.description end,
    category_id = case when p_patch ? 'category_id' then nullif(p_patch->>'category_id', '')::uuid else a.category_id end,
    content = case when p_patch ? 'content' then p_patch->'content' else a.content end,
    content_text = case when p_patch ? 'content_text' then coalesce(p_patch->>'content_text', '') else a.content_text end,
    reading_minutes = case when p_patch ? 'content_text' then public.ganeko_journal_reading_minutes(p_patch->>'content_text') else a.reading_minutes end,
    cover_url = case when p_patch ? 'cover_url' then nullif(p_patch->>'cover_url', '') else a.cover_url end,
    seo_title = case when p_patch ? 'seo_title' then coalesce(p_patch->>'seo_title', '') else a.seo_title end,
    seo_description = case when p_patch ? 'seo_description' then coalesce(p_patch->>'seo_description', '') else a.seo_description end,
    featured = case when p_patch ? 'featured' then coalesce((p_patch->>'featured')::boolean, a.featured) else a.featured end,
    allow_reactions = case when p_patch ? 'allow_reactions' then coalesce((p_patch->>'allow_reactions')::boolean, a.allow_reactions) else a.allow_reactions end,
    published_at = case when p_patch ? 'published_at' and a.status = 'published' then coalesce((p_patch->>'published_at')::timestamptz, a.published_at) else a.published_at end,
    updated_at = now()
  where a.id = p_id
  returning a.updated_at into v_updated;
  if v_updated is null then
    raise exception 'not found' using errcode = 'P0002';
  end if;
  return v_updated;
end;
$$;

create function public.ganeko_journal_admin_set_status(p_token text, p_id uuid, p_status text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare r public.ganeko_journal_articles;
begin
  perform public.ganeko_journal_guard(p_token);
  if p_status not in ('draft', 'published') then
    raise exception 'invalid status' using errcode = '22023';
  end if;
  select * into r from public.ganeko_journal_articles where id = p_id for update;
  if not found then
    raise exception 'not found' using errcode = 'P0002';
  end if;
  if p_status = 'published' and btrim(r.title) = '' then
    raise exception 'title required' using errcode = '22023';
  end if;
  update public.ganeko_journal_articles
  set status = p_status,
      published_at = case when p_status = 'published' then coalesce(published_at, now()) else published_at end,
      updated_at = now()
  where id = p_id
  returning * into r;
  return jsonb_build_object('status', r.status, 'published_at', r.published_at, 'updated_at', r.updated_at);
end;
$$;

create function public.ganeko_journal_admin_delete_article(p_token text, p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.ganeko_journal_guard(p_token);
  delete from public.ganeko_journal_articles where id = p_id;
end;
$$;

-- ── Categories ───────────────────────────────────────────────────────────

create function public.ganeko_journal_admin_save_category(p_token text, p_id uuid, p_name text, p_slug text, p_position int)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare v_id uuid;
begin
  perform public.ganeko_journal_guard(p_token);
  insert into public.ganeko_journal_categories (id, name, slug, position)
  values (coalesce(p_id, gen_random_uuid()), p_name, p_slug, coalesce(p_position, 0))
  on conflict (id) do update set name = excluded.name, slug = excluded.slug, position = excluded.position
  returning id into v_id;
  return v_id;
end;
$$;

create function public.ganeko_journal_admin_delete_category(p_token text, p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.ganeko_journal_guard(p_token);
  delete from public.ganeko_journal_categories where id = p_id;
end;
$$;

-- ── Interactive components ───────────────────────────────────────────────

create function public.ganeko_journal_admin_list_components(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.ganeko_journal_guard(p_token);
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', c.id, 'name', c.name, 'html', c.html, 'created_at', c.created_at, 'updated_at', c.updated_at,
      'usage', (select count(*) from public.ganeko_journal_articles a
                where a.content::text like '%"componentId": "' || c.id::text || '"%'
                   or a.content::text like '%"componentId":"' || c.id::text || '"%')
    ) order by c.updated_at desc)
    from public.ganeko_journal_components c
  ), '[]'::jsonb);
end;
$$;

create function public.ganeko_journal_admin_save_component(p_token text, p_id uuid, p_name text, p_html text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare r public.ganeko_journal_components;
begin
  perform public.ganeko_journal_guard(p_token);
  insert into public.ganeko_journal_components (id, name, html)
  values (coalesce(p_id, gen_random_uuid()), p_name, p_html)
  on conflict (id) do update set name = excluded.name, html = excluded.html, updated_at = now()
  returning * into r;
  return to_jsonb(r);
end;
$$;

create function public.ganeko_journal_admin_delete_component(p_token text, p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.ganeko_journal_guard(p_token);
  delete from public.ganeko_journal_components where id = p_id;
end;
$$;

-- ── Image uploads ────────────────────────────────────────────────────────

create function public.ganeko_journal_admin_upload_ticket(p_token text, p_path text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.ganeko_journal_guard(p_token);
  if p_path !~ '^articles/[0-9a-f-]{36}/[0-9a-f-]{36}\.(png|jpg|jpeg|webp|gif|avif)$' then
    raise exception 'invalid path' using errcode = '22023';
  end if;
  delete from public.ganeko_journal_upload_tickets where expires_at < now();
  insert into public.ganeko_journal_upload_tickets (path, expires_at)
  values (p_path, now() + interval '10 minutes')
  on conflict (path) do update set expires_at = excluded.expires_at;
end;
$$;

-- Used by the storage policy (runs as the uploader); only answers "is this exact path ticketed?".
create function public.ganeko_journal_upload_ok(p_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.ganeko_journal_upload_tickets t
    where t.path = p_name and t.expires_at > now()
  );
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ganeko-journal', 'ganeko-journal', true, 10485760,
        array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'])
on conflict (id) do nothing;

create policy "Ganeko Journal upload with ticket" on storage.objects
  for insert to anon
  with check (bucket_id = 'ganeko-journal' and public.ganeko_journal_upload_ok(name));

-- ── Reactions (public) ───────────────────────────────────────────────────

create function public.ganeko_journal_react(p_article_id uuid, p_emoji text, p_delta int)
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
    select 1 from public.ganeko_journal_articles
    where id = p_article_id and status = 'published' and allow_reactions
  ) then
    raise exception 'not found' using errcode = 'P0002';
  end if;
  insert into public.ganeko_journal_reactions (article_id, emoji, count)
  values (p_article_id, p_emoji, greatest(p_delta, 0))
  on conflict (article_id, emoji) do update set count = greatest(0, public.ganeko_journal_reactions.count + p_delta)
  returning count into v_count;
  return v_count;
end;
$$;

-- The Next.js server calls the admin functions with the publishable key; the token is the authorization.
revoke execute on function public.ganeko_journal_reading_minutes(text) from public, anon, authenticated;
revoke execute on function public.ganeko_journal_admin_list_articles(text) from public;
revoke execute on function public.ganeko_journal_admin_get_article(text, uuid) from public;
revoke execute on function public.ganeko_journal_admin_create_article(text, text, text) from public;
revoke execute on function public.ganeko_journal_admin_update_article(text, uuid, jsonb) from public;
revoke execute on function public.ganeko_journal_admin_set_status(text, uuid, text) from public;
revoke execute on function public.ganeko_journal_admin_delete_article(text, uuid) from public;
revoke execute on function public.ganeko_journal_admin_save_category(text, uuid, text, text, int) from public;
revoke execute on function public.ganeko_journal_admin_delete_category(text, uuid) from public;
revoke execute on function public.ganeko_journal_admin_list_components(text) from public;
revoke execute on function public.ganeko_journal_admin_save_component(text, uuid, text, text) from public;
revoke execute on function public.ganeko_journal_admin_delete_component(text, uuid) from public;
revoke execute on function public.ganeko_journal_admin_upload_ticket(text, text) from public;
revoke execute on function public.ganeko_journal_upload_ok(text) from public, authenticated;
revoke execute on function public.ganeko_journal_react(uuid, text, int) from public;

grant execute on function public.ganeko_journal_admin_list_articles(text) to anon;
grant execute on function public.ganeko_journal_admin_get_article(text, uuid) to anon;
grant execute on function public.ganeko_journal_admin_create_article(text, text, text) to anon;
grant execute on function public.ganeko_journal_admin_update_article(text, uuid, jsonb) to anon;
grant execute on function public.ganeko_journal_admin_set_status(text, uuid, text) to anon;
grant execute on function public.ganeko_journal_admin_delete_article(text, uuid) to anon;
grant execute on function public.ganeko_journal_admin_save_category(text, uuid, text, text, int) to anon;
grant execute on function public.ganeko_journal_admin_delete_category(text, uuid) to anon;
grant execute on function public.ganeko_journal_admin_list_components(text) to anon;
grant execute on function public.ganeko_journal_admin_save_component(text, uuid, text, text) to anon;
grant execute on function public.ganeko_journal_admin_delete_component(text, uuid) to anon;
grant execute on function public.ganeko_journal_admin_upload_ticket(text, text) to anon;
grant execute on function public.ganeko_journal_upload_ok(text) to anon;
grant execute on function public.ganeko_journal_react(uuid, text, int) to anon, authenticated;

insert into public.ganeko_journal_categories (slug, name, position) values
  ('fundamentos', 'Fundamentos', 1),
  ('programacao', 'Programação', 2),
  ('backend', 'Backend', 3),
  ('sistemas', 'Sistemas', 4),
  ('ia', 'Inteligência Artificial', 5),
  ('carreira', 'Carreira', 6);
