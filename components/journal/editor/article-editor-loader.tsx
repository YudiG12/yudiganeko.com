"use client";

import dynamic from "next/dynamic";

// O editor (Tiptap + CodeMirror) só existe no navegador e só é baixado no admin.
const ArticleEditor = dynamic(() => import("./article-editor"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-oatmeal border-t-truffle-trouble" />
    </div>
  ),
});

export default ArticleEditor;
