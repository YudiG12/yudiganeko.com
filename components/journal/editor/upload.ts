"use client";

import { createClient } from "@supabase/supabase-js";
import { requestUploadAction } from "@/app/admin/actions";

/** Sobe uma imagem: o servidor libera um caminho (ticket) e o navegador envia direto ao Storage. */
export async function uploadImage(file: File, articleId: string | null): Promise<string> {
  const ticket = await requestUploadAction(articleId, file.type, file.size);
  if (!ticket.ok) throw new Error(ticket.error);
  const { url, key, bucket, path, publicUrl } = ticket.data;
  const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await sb.storage.from(bucket).upload(path, file, { contentType: file.type, cacheControl: "31536000" });
  if (error) throw new Error("Não foi possível enviar a imagem.");
  return publicUrl;
}

export function pickImage(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/png,image/jpeg,image/webp,image/gif,image/avif";
    input.onchange = () => resolve(input.files?.[0] ?? null);
    input.oncancel = () => resolve(null);
    input.click();
  });
}
