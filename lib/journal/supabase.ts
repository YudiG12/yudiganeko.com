import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente do Supabase do site (projeto salariodev), sempre com a chave publishable.
 * Leituras públicas passam pelo RLS (só artigos publicados). Escritas usam as funções
 * `ganeko_journal_admin_*`, autorizadas pelo JOURNAL_WRITE_TOKEN — o mesmo modelo do roadmap.
 */
let client: SupabaseClient | null = null;

// Projeto salariodev. URL e chave publishable são públicas por natureza (a proteção é o RLS),
// então ficam no código; as env vars só servem para apontar para outro projeto se precisar.
const SUPABASE_URL = process.env.SUPABASE_URL || "https://nmvajkrrsqojpntxymmg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || "sb_publishable_LIIcXcPgy9cCp8kgVJa0FA__RV529t8";

export function journalConfigured() {
  return true;
}

export function getSupabase(): SupabaseClient {
  if (client) return client;
  client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

/** Config pública usada pelo navegador do admin para subir imagens com um ticket. */
export function publicStorageConfig() {
  return {
    url: SUPABASE_URL,
    key: SUPABASE_PUBLISHABLE_KEY,
    bucket: "ganeko-journal",
  };
}
