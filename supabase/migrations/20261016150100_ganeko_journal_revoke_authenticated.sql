-- Admin functions are only for the Next.js server (anon key + write token), never for signed-in users.
revoke execute on function public.ganeko_journal_admin_list_articles(text) from authenticated;
revoke execute on function public.ganeko_journal_admin_get_article(text, uuid) from authenticated;
revoke execute on function public.ganeko_journal_admin_create_article(text, text, text) from authenticated;
revoke execute on function public.ganeko_journal_admin_update_article(text, uuid, jsonb) from authenticated;
revoke execute on function public.ganeko_journal_admin_set_status(text, uuid, text) from authenticated;
revoke execute on function public.ganeko_journal_admin_delete_article(text, uuid) from authenticated;
revoke execute on function public.ganeko_journal_admin_save_category(text, uuid, text, text, int) from authenticated;
revoke execute on function public.ganeko_journal_admin_delete_category(text, uuid) from authenticated;
revoke execute on function public.ganeko_journal_admin_list_components(text) from authenticated;
revoke execute on function public.ganeko_journal_admin_save_component(text, uuid, text, text) from authenticated;
revoke execute on function public.ganeko_journal_admin_delete_component(text, uuid) from authenticated;
revoke execute on function public.ganeko_journal_admin_upload_ticket(text, text) from authenticated;
