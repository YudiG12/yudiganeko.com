"use client";

import { createContext, useContext } from "react";
import type { InteractiveComponent } from "@/lib/journal/types";

export type EditorCtx = {
  articleId: string | null;
  components: InteractiveComponent[];
  refreshComponents: () => Promise<void>;
  toast: (message: string, tone?: "ok" | "error") => void;
  openLibrary: (onPick: (c: InteractiveComponent) => void) => void;
};

export const EditorContext = createContext<EditorCtx | null>(null);

export function useEditorCtx() {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error("EditorContext ausente");
  return ctx;
}
