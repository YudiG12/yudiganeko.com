import Link from "next/link";
import { formatDate } from "@/lib/journal/content";
import { articleUrl } from "@/lib/journal/site";
import type { ArticleSummary } from "@/lib/journal/types";

/**
 * Card do Journal no formato de thumbnail de vídeo: título sobre a imagem, descrição e data embaixo.
 * Mesmo componente na home, na listagem, na categoria e em "continue lendo".
 */
export default function ArticleCard({
  article,
  className = "",
  sizes = "300px",
  priority = false,
}: {
  article: ArticleSummary;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  return (
    <Link
      href={articleUrl(article.slug)}
      className={`group flex flex-col gap-2.5 rounded-2xl text-left outline-none focus-visible:ring-2 focus-visible:ring-truffle-trouble/50 focus-visible:ring-offset-4 ${className}`}
    >
      <span className="relative block aspect-video overflow-hidden rounded-2xl bg-[#1f2733] shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1)] ring-1 ring-oatmeal/60 transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(.22,1,.36,1)] group-hover:-translate-y-1 group-hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.15),0_8px_10px_-6px_rgba(0,0,0,0.1)] group-active:translate-y-0 group-active:scale-[0.99]">
        {article.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.cover_url}
            alt=""
            sizes={sizes}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <span
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(249,247,244,0.09)_1px,transparent_0)] [background-size:18px_18px]"
          />
        )}
        <span className="absolute inset-x-0 bottom-0 h-[84px] bg-[linear-gradient(to_top,rgba(24,32,44,0.95)_0%,rgba(24,32,44,0.75)_45%,rgba(24,32,44,0)_100%)]" />
        <span className="absolute inset-x-3.5 bottom-3 line-clamp-2 font-mono text-sm font-semibold leading-[19px] tracking-[0.01em] text-white">
          {article.title}
        </span>
      </span>
      {article.description && (
        <span className="line-clamp-2 px-0.5 font-mono text-[13px] leading-5 tracking-[0.02em] text-blue-fantastic/75">
          {article.description}
        </span>
      )}
      <span className="px-0.5 font-mono text-xs tracking-[0.025em] text-blue-fantastic/60 transition-colors group-hover:text-blue-fantastic">
        {formatDate(article.published_at)}
      </span>
    </Link>
  );
}
