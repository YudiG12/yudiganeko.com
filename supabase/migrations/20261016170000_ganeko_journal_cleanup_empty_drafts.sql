-- "Novo artigo" cria o rascunho na hora; os que ficaram vazios por mais de 1 hora são apagados.
create function public.ganeko_journal_admin_cleanup_empty(p_token text)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare v_count int;
begin
  perform public.ganeko_journal_guard(p_token);
  delete from public.ganeko_journal_articles a
  where a.status = 'draft'
    and btrim(a.title) = ''
    and btrim(a.description) = ''
    and btrim(a.content_text) = ''
    and a.cover_url is null
    and a.content::text not like '%"type": "interactive"%'
    and a.content::text not like '%"type": "image"%'
    and a.updated_at < now() - interval '1 hour';
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;
revoke execute on function public.ganeko_journal_admin_cleanup_empty(text) from public, authenticated;
grant execute on function public.ganeko_journal_admin_cleanup_empty(text) to anon;
