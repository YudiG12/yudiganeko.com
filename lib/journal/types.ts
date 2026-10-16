// Tipos compartilhados do Ganeko Journal.

export type JSONContent = {
  type?: string;
  attrs?: Record<string, unknown>;
  content?: JSONContent[];
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  text?: string;
};

export type Category = {
  id: string;
  slug: string;
  name: string;
  position: number;
};

export type ArticleStatus = "draft" | "published";

export type ArticleSummary = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category_id: string | null;
  status: ArticleStatus;
  cover_url: string | null;
  reading_minutes: number;
  published_at: string | null;
  updated_at: string;
};

export type Article = ArticleSummary & {
  content: JSONContent;
  content_text: string;
  seo_title: string;
  seo_description: string;
  featured: boolean;
  allow_reactions: boolean;
  created_at: string;
};

export type AdminArticleRow = ArticleSummary & { created_at: string; reactions: number };

export type InteractiveComponent = {
  id: string;
  name: string;
  html: string;
  created_at: string;
  updated_at: string;
  usage?: number;
};

export const REACTIONS = ["🤯", "🔥", "👏", "❤️", "🤔"] as const;
export type ReactionEmoji = (typeof REACTIONS)[number];
