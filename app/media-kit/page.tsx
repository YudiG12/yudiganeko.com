import Link from "next/link";
import { Suspense } from "react";
import SponsorLogo from "./components/SponsorLogo";
import CopyEmailButton from "./components/CopyEmailButton";
import {
  YouTubeHoverPreview,
  InstagramHoverPreview,
} from "./components/VideoHoverPreview";
import {
  fetchChannelStats,
  fetchDemographics,
  fetchTopVideos,
  fetchYTEngagement,
  type YTDemographics,
  type YTEngagement,
  type YTStats,
  type YTVideo,
} from "./lib/youtube";
import {
  fetchIGDemographics,
  fetchIGEngagement,
  fetchIGProfile,
  fetchIGTopMedia,
  type IGDemographics,
  type IGEngagement,
  type IGMedia,
  type IGProfile,
} from "./lib/instagram";
import {
  CONFIG,
  localizedField,
  USD_TO_BRL,
  type Locale,
  type Service,
  type SponsorEntry,
} from "./lib/config";

export const metadata = {
  title: "Media Kit · Yudi Ganeko",
  description:
    "Audience, real numbers and partnership formats with Yudi Ganeko — Brazilian tech creator.",
};

export const revalidate = 3600;

// ─────────────────────────────────────────────────────────────────────────────
// i18n dictionary — single source of truth for translatable UI strings.
// ─────────────────────────────────────────────────────────────────────────────

const DICT = {
  en: {
    "eyebrow.book": "media kit",
    "live.label": "live · refreshed hourly",
    "copy.copy": "copy",
    "copy.copied": "copied",
    "headline.l1": "creator-builder.",
    "headline.l2": "building in public.",
    "stat.subscribers": "subscribers",
    "stat.followers": "followers",
    "stat.totalViews": "total views",
    "stat.onChannel": "on channel",
    "stat.videos": "videos",
    "stat.published": "published",
    "stat.youtube": "youtube",
    "stat.instagram": "instagram",
    "noCreds":
      "No credentials yet. See MEDIA_KIT.md to wire up YouTube and Instagram.",
    "section.audience": "Audience",
    "section.audience.aside": "real numbers, refreshed hourly",
    "section.engagement": "Content engagement",
    "section.engagement.aside": "how the audience interacts, last 365 days",
    "engagement.avgDuration": "avg view duration",
    "engagement.avgPercent": "avg % watched",
    "engagement.subsGained": "new subscribers",
    "engagement.likeRate": "like rate",
    "engagement.avgLikes": "avg likes per post",
    "engagement.avgComments": "avg comments per post",
    "engagement.engagementRate": "engagement rate",
    "engagement.totalInteractions": "total interactions",
    "engagement.window": "last 365 days",
    "engagement.window.recent": "last 50 posts",
    "engagement.empty":
      "Engagement needs OAuth — connect YouTube Analytics + Instagram Insights.",
    "section.demographics": "Who watches",
    "section.videos": "Top-reach videos",
    "section.posts": "Featured posts",
    "section.sponsors": "Trusted by",
    "section.sponsors.aside": "Many partners have worked with me",
    "section.formats": "Partnership formats",
    "table.subscribers": "Subscribers",
    "table.totalViews": "Total views",
    "table.videoCount": "Videos published",
    "table.avgViews": "Avg views per video",
    "table.followers": "Followers",
    "table.posts": "Posts",
    "table.ratio": "Followers/Following ratio",
    "table.engagement": "Content engagement",
    "platform.notConnected":
      "Not connected. Set the env vars in .env.local to fetch live data.",
    "demo.window": "last 365 days",
    "demo.window.lifetime": "lifetime",
    "demo.age": "age",
    "demo.gender": "gender",
    "demo.where": "where they are",
    "demo.noData": "No data.",
    "demo.empty":
      "Demographics need OAuth — YouTube Analytics API (channel) and Instagram Insights (business account). See MEDIA_KIT.md to run the auth scripts.",
    "gender.f": "Female",
    "gender.m": "Male",
    "gender.u": "Unknown",
    "videos.empty":
      "No videos pulled yet. Set YOUTUBE_API_KEY + YOUTUBE_CHANNEL_ID.",
    "videos.views": "views",
    "ig.reel": "reel",
    "ig.video": "video",
    "ig.carousel": "carousel",
    "ig.photo": "photo",
    "sponsors.video": "video",
    "sponsors.videos": "videos",
    "service.format": "format",
    "service.priceFrom": "value",
    "cta.eyebrow": "let's talk",
    "cta.title": "Got a brand that deserves to reach this audience?",
    "cta.body":
      "I reply briefs in up to 48h. Discovery calls before any proposal — I want to understand the product before I talk about it.",
    "cta.button": "Send email",
    "cta.subject": "Partnership · briefing",
    "cta.also": "or find me on",
    "contact.email": "Email",
    "contact.whatsapp": "WhatsApp",
    "contact.instagram": "Instagram",
    "contact.youtube": "YouTube",
    "contact.website": "Website",
    "lang.en": "EN",
    "lang.pt": "PT",
  },
  pt: {
    "eyebrow.book": "media kit",
    "live.label": "ao vivo · atualizado a cada hora",
    "copy.copy": "copiar",
    "copy.copied": "copiado",
    "headline.l1": "creator-builder.",
    "headline.l2": "construindo em público.",
    "stat.subscribers": "inscritos",
    "stat.followers": "seguidores",
    "stat.totalViews": "views totais",
    "stat.onChannel": "no canal",
    "stat.videos": "vídeos",
    "stat.published": "publicados",
    "stat.youtube": "youtube",
    "stat.instagram": "instagram",
    "noCreds":
      "Sem credenciais ainda. Veja MEDIA_KIT.md pra plugar YouTube e Instagram.",
    "section.audience": "Audiência",
    "section.audience.aside": "números reais, atualizados a cada hora",
    "section.engagement": "Engajamento",
    "section.engagement.aside": "como a audiência interage, últimos 365 dias",
    "engagement.avgDuration": "tempo médio assistido",
    "engagement.avgPercent": "% médio do vídeo",
    "engagement.subsGained": "novos inscritos",
    "engagement.likeRate": "taxa de likes",
    "engagement.avgLikes": "média de likes por post",
    "engagement.avgComments": "média de comments por post",
    "engagement.engagementRate": "taxa de engajamento",
    "engagement.totalInteractions": "interações totais",
    "engagement.window": "últimos 365 dias",
    "engagement.window.recent": "últimos 50 posts",
    "engagement.empty":
      "Engagement precisa de OAuth — conecte YouTube Analytics + Instagram Insights.",
    "section.demographics": "Quem assiste",
    "section.videos": "Vídeos com maior alcance",
    "section.posts": "Posts em destaque",
    "section.sponsors": "Marcas que confiaram",
    "section.sponsors.aside": "Inúmeros parceiros já trabalharam comigo",
    "section.formats": "Formatos de parceria",
    "table.subscribers": "Inscritos",
    "table.totalViews": "Views totais",
    "table.videoCount": "Vídeos publicados",
    "table.avgViews": "Views/vídeo (média)",
    "table.followers": "Seguidores",
    "table.posts": "Posts",
    "table.ratio": "Razão seguidores/seguindo",
    "table.engagement": "Content engagement",
    "platform.notConnected":
      "Não conectado. Configure as variáveis no .env.local pra puxar dados ao vivo.",
    "demo.window": "últimos 365 dias",
    "demo.window.lifetime": "lifetime",
    "demo.age": "idade",
    "demo.gender": "gênero",
    "demo.where": "onde estão",
    "demo.noData": "Sem dados.",
    "demo.empty":
      "Demografia precisa de OAuth — YouTube Analytics API (canal) e Instagram Insights (conta business). Veja MEDIA_KIT.md.",
    "gender.f": "Feminino",
    "gender.m": "Masculino",
    "gender.u": "Não informado",
    "videos.empty":
      "Sem vídeos puxados ainda. Configure YOUTUBE_API_KEY + YOUTUBE_CHANNEL_ID.",
    "videos.views": "views",
    "ig.reel": "reel",
    "ig.video": "vídeo",
    "ig.carousel": "carrossel",
    "ig.photo": "foto",
    "sponsors.video": "vídeo",
    "sponsors.videos": "vídeos",
    "service.format": "formato",
    "service.priceFrom": "valor",
    "cta.eyebrow": "vamos conversar",
    "cta.title": "Tem uma marca que merece chegar nessa audiência?",
    "cta.body":
      "Respondo briefings em até 48h. Faço calls de descoberta antes de qualquer proposta — quero entender o produto antes de falar dele.",
    "cta.button": "Mandar email",
    "cta.subject": "Parceria · briefing",
    "cta.also": "ou me acha em",
    "contact.email": "Email",
    "contact.whatsapp": "WhatsApp",
    "contact.instagram": "Instagram",
    "contact.youtube": "YouTube",
    "contact.website": "Site",
    "lang.en": "EN",
    "lang.pt": "PT",
  },
} as const;

type T = (k: keyof (typeof DICT)["en"]) => string;

function makeT(locale: Locale): T {
  return (k) => DICT[locale][k] ?? DICT.en[k];
}

function resolveLocale(raw: string | undefined): Locale {
  if (raw === "pt" || raw === "pt-br" || raw === "ptbr") return "pt";
  return "en";
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────
export default async function MediaKitPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const { lang } = await searchParams;
  const locale = resolveLocale(lang);
  const t = makeT(locale);

  const config = CONFIG;
  const tagline = locale === "en" ? config.taglineEN : config.tagline;
  const intro = locale === "en" ? config.introEN : config.intro;

  const sponsors = config.sponsors;

  return (
    <main className="relative z-10 min-h-screen overflow-x-hidden px-4 pb-24 sm:px-5 md:px-10">
      <div className="mx-auto mt-6 flex max-w-[1180px] items-center justify-center gap-2.5 font-mono text-[10.5px] uppercase tracking-[0.24em] text-muted md:mt-8">
        <span aria-hidden className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-flame opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-flame" />
        </span>
        <span>{t("live.label")}</span>
      </div>

      {/* Hero streams in first, on its own. */}
      <div className="mx-auto mt-4 max-w-[1180px] md:mt-5">
        <Suspense
          fallback={
            <HeroSkeleton
              t={t}
              tagline={tagline}
              intro={intro}
              email={config.contact.email}
              sponsors={sponsors}
              copyLabel={t("copy.copy")}
              copiedLabel={t("copy.copied")}
            />
          }
        >
          <HeroAsync
            t={t}
            locale={locale}
            tagline={tagline}
            intro={intro}
            email={config.contact.email}
            sponsors={sponsors}
          />
        </Suspense>
      </div>

      {/* Each section streams in independently — the page chrome above is
          static and instant, sections fade up as their data resolves. */}
      <article className="mx-auto mt-16 w-full min-w-0 max-w-[1180px] space-y-20 md:mt-20 md:space-y-28">
        <Section
          eyebrow={`01 · ${locale === "en" ? "audience" : "audiência"}`}
          title={t("section.audience")}
        >
          <Suspense fallback={<AudienceSkeleton />}>
            <AudienceAsync t={t} />
          </Suspense>
        </Section>

        <Section
          eyebrow={`02 · ${locale === "en" ? "demographics" : "demografia"}`}
          title={t("section.demographics")}
        >
          <Suspense fallback={<DemographicsSkeleton t={t} />}>
            <DemographicsAsync t={t} />
          </Suspense>
        </Section>

        <Section
          eyebrow={`03 · ${locale === "en" ? "videos" : "vídeos"}`}
          title={t("section.videos")}
        >
          <Suspense fallback={<VideosSkeleton />}>
            <VideosAsync t={t} locale={locale} />
          </Suspense>
        </Section>

        <Section
          eyebrow="04 · instagram"
          title={t("section.posts")}
        >
          <Suspense fallback={<PostsSkeleton />}>
            <PostsAsync t={t} />
          </Suspense>
        </Section>

        <Section
          eyebrow={`05 · ${locale === "en" ? "formats" : "formatos"}`}
          title={t("section.formats")}
        >
          <div className="animate-fadeUp">
            <Services t={t} services={config.services} locale={locale} />
          </div>
        </Section>

        <div className="animate-fadeUp">
          <ContactCTA t={t} config={config} />
        </div>
      </article>

      <LanguageToggle locale={locale} t={t} />
    </main>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Async wrappers — each fetches its own data and streams in with a fade-up.
// Server-side fetch dedup means hitting the same URL twice is free.
// ─────────────────────────────────────────────────────────────────────────────
async function HeroAsync({
  t,
  locale,
  tagline,
  intro,
  email,
  sponsors,
}: {
  t: T;
  locale: Locale;
  tagline: string;
  intro: string;
  email: string;
  sponsors: SponsorEntry[];
}) {
  const [ytStats, igProfile] = await Promise.all([
    fetchChannelStats(),
    fetchIGProfile(),
  ]);
  return (
    <div className="animate-fadeUp">
      <Hero
        t={t}
        locale={locale}
        tagline={tagline}
        intro={intro}
        email={email}
        sponsors={sponsors}
        ytStats={ytStats}
        igProfile={igProfile}
      />
    </div>
  );
}

async function AudienceAsync({ t }: { t: T }) {
  const [ytStats, ytEng, igProfile, igEng] = await Promise.all([
    fetchChannelStats(),
    fetchYTEngagement(),
    fetchIGProfile(),
    fetchIGEngagement(),
  ]);
  return (
    <div className="animate-fadeUp">
      <AudienceStats
        t={t}
        ytStats={ytStats}
        ytEng={ytEng}
        igProfile={igProfile}
        igEng={igEng}
      />
    </div>
  );
}

async function DemographicsAsync({ t }: { t: T }) {
  const [ytDemo, igDemo] = await Promise.all([
    fetchDemographics(),
    fetchIGDemographics(),
  ]);
  return (
    <div className="animate-fadeUp">
      <Demographics t={t} yt={ytDemo} ig={igDemo} />
    </div>
  );
}

async function VideosAsync({ t, locale }: { t: T; locale: Locale }) {
  const videos = await fetchTopVideos(6);
  return (
    <div className="animate-fadeUp">
      <TopVideos t={t} videos={videos} locale={locale} />
    </div>
  );
}

async function PostsAsync({ t }: { t: T }) {
  const media = await fetchIGTopMedia(6);
  if (media.length === 0) {
    return (
      <div className="animate-fadeUp rounded-2xl border border-dashed border-line bg-paper/40 p-8 text-center text-[13px] text-muted">
        —
      </div>
    );
  }
  return (
    <div className="animate-fadeUp">
      <TopMedia t={t} media={media} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeletons — static structural placeholders. No pulse, no shimmer. Mirror
// the real component dimensions so the page doesn't jump when content arrives.
// ─────────────────────────────────────────────────────────────────────────────
function SkeletonBox({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-2xl border border-line bg-paper/40 ${className}`} />
  );
}

function HeroSkeleton({
  t,
  tagline,
  intro,
  email,
  sponsors,
  copyLabel,
  copiedLabel,
}: {
  t: T;
  tagline: string;
  intro: string;
  email: string;
  sponsors: SponsorEntry[];
  copyLabel: string;
  copiedLabel: string;
}) {
  // Mirrors the real Hero panel so there's no layout jump when stats stream
  // in — only the four stat chips are skeletons; portrait + copy render now.
  return (
    <section className="relative overflow-hidden rounded-[28px] border border-line bg-indigo text-palladian md:rounded-[40px]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(680px 540px at 80% 6%, rgba(255,177,98,0.42), transparent 60%), radial-gradient(560px 520px at 99% 96%, rgba(163,81,73,0.5), transparent 62%), radial-gradient(700px 480px at 6% -8%, rgba(255,255,255,0.07), transparent 60%)",
        }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/yudi-portrait.png"
        alt="Yudi Ganeko"
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-2 z-10 hidden h-[98%] w-auto max-w-[46%] select-none object-contain object-bottom drop-shadow-2xl md:block lg:right-8"
      />
      <div className="relative z-20 grid grid-cols-1 gap-8 p-6 sm:p-8 md:grid-cols-12 md:gap-10 md:p-12">
        <div className="md:col-span-7">
          <h1 className="text-[30px] font-bold leading-[0.95] tracking-[-0.04em] sm:text-[48px] md:text-[64px]">
            {/* Headline is locale-driven, not data-driven — render it immediately. */}
            {t("headline.l1")} <br />
            <span className="text-flame">{t("headline.l2")}</span>
          </h1>
          <p className="mt-5 max-w-xl text-[15px] leading-[1.55] text-palladian/75 sm:text-[16px]">
            {renderWithAiHighlight(tagline)}
          </p>
          <p className="mt-3 max-w-lg text-[13.5px] leading-[1.6] text-palladian/55 sm:text-[14px]">
            {renderWithStoryHighlight(intro)}
          </p>
          <div className="mt-7 grid max-w-xl grid-cols-2 gap-2.5 sm:flex sm:flex-wrap">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-[78px] flex-1 rounded-2xl border border-palladian/15 bg-palladian/[0.06] sm:min-w-[124px]"
              />
            ))}
          </div>
          <div className="mt-6 flex max-w-full justify-stretch sm:justify-start">
            <CopyEmailButton
              email={email}
              copyLabel={copyLabel}
              copiedLabel={copiedLabel}
              compact
            />
          </div>

          {/* Sponsors render now — same as the resolved hero, no jump. */}
          <HeroSponsors sponsors={sponsors} t={t} />
        </div>
        <div className="-mb-6 flex justify-center sm:-mb-8 md:hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/yudi-portrait.png"
            alt="Yudi Ganeko"
            className="pointer-events-none h-auto max-h-[300px] w-auto select-none object-contain drop-shadow-2xl"
          />
        </div>
      </div>
    </section>
  );
}

function AudienceSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
      <SkeletonBox className="h-[218px]" />
      <SkeletonBox className="h-[218px]" />
    </div>
  );
}

function DemographicsSkeleton({ t }: { t: T }) {
  return (
    <div className="space-y-6">
      <SkeletonBox className="h-[290px]" />
      <SkeletonBox className="h-[290px]" />
    </div>
  );
}

function VideosSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-2xl border border-line bg-paper/40"
        >
          <div className="aspect-video w-full" />
          <div className="space-y-2 p-4">
            <div className="h-4 w-3/4 rounded bg-paper/60" />
            <div className="h-3 w-1/2 rounded bg-paper/60" />
          </div>
        </div>
      ))}
    </div>
  );
}

function PostsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonBox key={i} className="aspect-square" />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Floating language toggle — fixed bottom right.
// ─────────────────────────────────────────────────────────────────────────────
function LanguageToggle({ locale, t }: { locale: Locale; t: T }) {
  const options: { code: Locale; href: string }[] = [
    { code: "en", href: "/media-kit" },
    { code: "pt", href: "/media-kit?lang=pt-br" },
  ];
  return (
    <div className="fixed bottom-5 right-5 z-40 flex items-center overflow-hidden rounded-full border border-line bg-paper/95 shadow-lg backdrop-blur md:bottom-7 md:right-7">
      {options.map((o, i) => {
        const active = o.code === locale;
        return (
          <Link
            key={o.code}
            href={o.href}
            scroll={false}
            aria-current={active ? "true" : undefined}
            className={`relative px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.22em] transition-colors ${
              active
                ? "bg-indigo text-palladian"
                : "text-muted hover:text-ink"
            } ${i > 0 ? "" : ""}`}
          >
            {t(`lang.${o.code}` as const)}
          </Link>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section shell
// ─────────────────────────────────────────────────────────────────────────────
function Section({
  eyebrow,
  title,
  aside,
  children,
}: {
  eyebrow: string;
  title: string;
  aside?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="w-full">
      <div className="grid w-full grid-cols-1 gap-4 border-t border-line pt-6 md:grid-cols-12 md:gap-8 md:pt-8">
        <div className="min-w-0 md:col-span-3">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h2 className="mt-2.5 text-2xl font-semibold leading-tight tracking-[-0.025em] sm:text-3xl md:text-[34px]">
            {title}
          </h2>
          {aside && (
            <p className="mt-2 max-w-xs text-[13px] leading-snug text-muted">
              {aside}
            </p>
          )}
        </div>
        <div className="min-w-0 md:col-span-9">{children}</div>
      </div>
    </section>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.28em] text-faint">
      <span aria-hidden className="h-[1px] w-6 bg-line-strong" />
      <span>{children}</span>
    </div>
  );
}

// Oversized network glyph that sits behind a stat chip — big, tilted and
// bleeding off the bottom-right corner so the chip reads as "the YouTube one".
function SocialGlyph({ kind }: { kind: "youtube" | "instagram" }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute -bottom-5 -right-4 z-0 ${
        kind === "youtube" ? "text-flame/25" : "text-palladian/15"
      }`}
      style={{ transform: "rotate(-18deg)" }}
    >
      {kind === "youtube" ? (
        <svg width="92" height="92" viewBox="0 0 24 24" fill="none">
          <rect
            x="1.5"
            y="5"
            width="21"
            height="14"
            rx="4.5"
            stroke="currentColor"
            strokeWidth="1.7"
          />
          <path d="M10 8.7 16 12l-6 3.3V8.7Z" fill="currentColor" />
        </svg>
      ) : (
        <svg
          width="88"
          height="88"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
        >
          <rect x="3" y="3" width="18" height="18" rx="5.4" />
          <circle cx="12" cy="12" r="4.2" />
          <circle cx="17.3" cy="6.7" r="1.15" fill="currentColor" stroke="none" />
        </svg>
      )}
    </span>
  );
}

// "Trusted by" social-proof strip, dark variant — lives at the bottom of the
// hero's content column so it never collides with the portrait. Logos loop
// left forever; the edge mask fades them in and out.
function HeroSponsors({ sponsors, t }: { sponsors: SponsorEntry[]; t: T }) {
  if (sponsors.length === 0) return null;
  // Duplicate 2× so the -50% marquee keyframe wraps seamlessly.
  const row = [...sponsors, ...sponsors];
  return (
    <div className="mt-8 border-t border-palladian/15 pt-5">
      <div className="mb-3.5 flex items-center gap-2.5 font-mono text-[9.5px] uppercase tracking-[0.26em] text-palladian/50">
        <span>{t("section.sponsors")}</span>
        <span aria-hidden className="h-[1px] flex-1 bg-palladian/12" />
        <span className="hidden text-palladian/40 sm:inline">
          {t("section.sponsors.aside")}
        </span>
      </div>
      <div className="marquee-mask overflow-hidden">
        <div className="animate-marquee flex items-center gap-5 sm:gap-8">
          {row.map((s, i) => (
            <div
              key={`${s.key}-${i}`}
              className="flex shrink-0 items-center gap-2 sm:gap-2.5"
            >
              <SponsorLogo
                brand={s.brand}
                domain={s.domain}
                logoSrc={s.logoSrc}
                color={s.color}
                size="md"
              />
              <span className="whitespace-nowrap text-[14px] font-semibold tracking-tight text-palladian/90 sm:text-[15px]">
                {s.brand}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hero
// ─────────────────────────────────────────────────────────────────────────────
function Hero({
  t,
  tagline,
  intro,
  email,
  sponsors,
  ytStats,
  igProfile,
}: {
  t: T;
  locale: Locale;
  tagline: string;
  intro: string;
  email: string;
  sponsors: SponsorEntry[];
  ytStats: YTStats | null;
  igProfile: IGProfile | null;
}) {
  // Stats become glass chips on the dark panel — YouTube subscribers get the
  // flame accent so the headline number reads first.
  const stats = (
    [
      ytStats && {
        eyebrow: t("stat.youtube"),
        value: shortNumber(ytStats.subscribers),
        label: t("stat.subscribers"),
        accent: true,
        glyph: "youtube" as const,
      },
      igProfile && {
        eyebrow: t("stat.instagram"),
        value: shortNumber(igProfile.followers),
        label: t("stat.followers"),
        glyph: "instagram" as const,
      },
      ytStats && {
        eyebrow: t("stat.totalViews"),
        value: shortNumber(ytStats.totalViews),
        label: t("stat.onChannel"),
      },
      ytStats && {
        eyebrow: t("stat.videos"),
        value: ytStats.videoCount.toString(),
        label: t("stat.published"),
      },
    ].filter(Boolean) as {
      eyebrow: string;
      value: string;
      label: string;
      accent?: boolean;
      glyph?: "youtube" | "instagram";
    }[]
  );

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-line bg-indigo text-palladian md:rounded-[40px]">
      {/* Ambient brand glows — flame top-right, truffle bottom-right. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(680px 540px at 80% 6%, rgba(255,177,98,0.42), transparent 60%), radial-gradient(560px 520px at 99% 96%, rgba(163,81,73,0.5), transparent 62%), radial-gradient(700px 480px at 6% -8%, rgba(255,255,255,0.07), transparent 60%)",
        }}
      />
      {/* Faint technical grid — nods to the build-in-public, dev side. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)",
          backgroundSize: "46px 46px",
          maskImage:
            "radial-gradient(70% 70% at 70% 30%, #000, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(70% 70% at 70% 30%, #000, transparent 75%)",
        }}
      />

      {/* Desktop portrait — stands on the panel's bottom edge. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/yudi-portrait.png"
        alt="Yudi Ganeko"
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-2 z-10 hidden h-[98%] w-auto max-w-[46%] select-none object-contain object-bottom drop-shadow-2xl md:block lg:right-8"
      />

      <div className="relative z-20 grid grid-cols-1 gap-8 p-6 sm:p-8 md:grid-cols-12 md:gap-10 md:p-12">
        <div className="md:col-span-7">
          <h1 className="text-[30px] font-bold leading-[0.95] tracking-[-0.04em] sm:text-[48px] md:text-[64px]">
            {t("headline.l1")} <br />
            <span className="text-flame">{t("headline.l2")}</span>
          </h1>

          <p className="mt-5 max-w-xl text-[15px] leading-[1.55] text-palladian/75 sm:text-[16px]">
            {renderWithAiHighlight(tagline)}
          </p>
          <p className="mt-3 max-w-lg text-[13.5px] leading-[1.6] text-palladian/55 sm:text-[14px]">
            {renderWithStoryHighlight(intro)}
          </p>

          {/* Live stats as glass chips — readable on the dark panel. */}
          {stats.length > 0 ? (
            <div className="mt-7 grid max-w-xl grid-cols-2 gap-2.5 sm:flex sm:flex-wrap">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className={`relative flex-1 overflow-hidden rounded-2xl border px-4 py-3 backdrop-blur-sm sm:min-w-[124px] ${
                    s.accent
                      ? "border-flame/40 bg-flame/[0.14]"
                      : "border-palladian/15 bg-palladian/[0.06]"
                  }`}
                >
                  {/* Oversized, rotated network glyph bleeding off the chip. */}
                  {s.glyph && <SocialGlyph kind={s.glyph} />}
                  <div className="relative z-10">
                    <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-palladian/55">
                      {s.eyebrow}
                    </div>
                    <div className="mt-1.5 text-[24px] font-bold leading-none tracking-tight">
                      {s.value}
                    </div>
                    <div className="mt-1 text-[11px] text-palladian/55">
                      {s.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-7 max-w-md rounded-2xl border border-dashed border-palladian/25 p-5">
              <p className="text-[13.5px] leading-snug text-palladian/65">
                {t("noCreds")}
              </p>
            </div>
          )}

          {/* Quick-grab email so a sponsor can act without scrolling. */}
          <div className="mt-6 flex max-w-full justify-stretch sm:justify-start">
            <CopyEmailButton
              email={email}
              copyLabel={t("copy.copy")}
              copiedLabel={t("copy.copied")}
              compact
            />
          </div>

          {/* Social proof, right inside the hero. */}
          <HeroSponsors sponsors={sponsors} t={t} />
        </div>

        {/* Mobile portrait — flush with the panel's bottom edge. */}
        <div className="-mb-6 flex justify-center sm:-mb-8 md:hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/yudi-portrait.png"
            alt="Yudi Ganeko"
            className="pointer-events-none h-auto max-h-[300px] w-auto select-none object-contain drop-shadow-2xl"
          />
        </div>
      </div>
    </section>
  );
}

function BigStat({
  eyebrow,
  value,
  label,
  tone,
}: {
  eyebrow: string;
  value: string;
  label: string;
  tone: "indigo" | "flame" | "paper";
}) {
  const palette = {
    indigo: { bg: "bg-indigo", ink: "text-palladian", sub: "text-palladian/70" },
    flame: { bg: "bg-flame", ink: "text-indigo", sub: "text-indigo/70" },
    paper: { bg: "bg-paper", ink: "text-ink", sub: "text-muted" },
  }[tone];

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-line p-4 sm:p-5 ${palette.bg}`}
    >
      <div
        className={`font-mono text-[10px] uppercase tracking-[0.22em] sm:text-[10.5px] sm:tracking-[0.24em] ${palette.sub}`}
      >
        {eyebrow}
      </div>
      <div
        className={`mt-2 text-[34px] font-bold leading-none tracking-[-0.035em] sm:mt-3 sm:text-[44px] md:text-[52px] ${palette.ink}`}
      >
        {value}
      </div>
      <div className={`mt-1.5 text-[11.5px] sm:text-[12.5px] ${palette.sub}`}>
        {label}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 01 · Audience stats (large breakdown)
// ─────────────────────────────────────────────────────────────────────────────
function AudienceStats({
  t,
  ytStats,
  ytEng,
  igProfile,
  igEng,
}: {
  t: T;
  ytStats: YTStats | null;
  ytEng: YTEngagement | null;
  igProfile: IGProfile | null;
  igEng: IGEngagement | null;
}) {
  // YouTube content engagement — last 30 days of interactions normalized by
  // subscriber count. This is the "audience engagement rate" formulation: how
  // much of the subscriber base actively interacted with content in a month.
  const ytEngagementPct =
    ytEng && ytStats && ytStats.subscribers > 0
      ? round1(
          ((ytEng.likes + ytEng.comments + ytEng.shares) / ytStats.subscribers) *
            100,
        )
      : null;

  // Instagram engagement rate: (avg likes + avg comments) / followers, in %.
  const igEngagementPct =
    igEng && igProfile && igProfile.followers > 0
      ? round1(((igEng.avgLikes + igEng.avgComments) / igProfile.followers) * 100)
      : null;

  const ytRows: PlatformRow[] = ytStats
    ? [
        { label: t("table.subscribers"), value: shortNumber(ytStats.subscribers) },
        { label: t("table.totalViews"), value: shortNumber(ytStats.totalViews) },
        { label: t("table.videoCount"), value: String(ytStats.videoCount) },
        ytEngagementPct !== null
          ? {
              label: t("table.engagement"),
              value: `${ytEngagementPct}%`,
              highlight: true,
            }
          : {
              label: t("table.avgViews"),
              value: shortNumber(
                ytStats.videoCount
                  ? Math.round(ytStats.totalViews / ytStats.videoCount)
                  : 0,
              ),
            },
      ]
    : [];

  const igRows: PlatformRow[] = igProfile
    ? [
        { label: t("table.followers"), value: shortNumber(igProfile.followers) },
        { label: t("table.posts"), value: String(igProfile.mediaCount) },
        igEngagementPct !== null
          ? {
              label: t("table.engagement"),
              value: `${igEngagementPct}%`,
              highlight: true,
            }
          : {
              label: t("table.ratio"),
              value: igProfile.follows
                ? (igProfile.followers / igProfile.follows).toFixed(1) + "x"
                : "—",
            },
      ]
    : [];

  return (
    <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
      <Platform
        t={t}
        platform="YouTube"
        connected={Boolean(ytStats)}
        handle={ytStats?.customUrl ?? "@yudiganeko"}
        rows={ytRows}
        accent="#A35149"
      />
      <Platform
        t={t}
        platform="Instagram"
        connected={Boolean(igProfile)}
        handle={igProfile ? `@${igProfile.username}` : "@ganekoyudi"}
        rows={igRows}
        accent="#FFB162"
      />
    </div>
  );
}

type PlatformRow = { label: string; value: string; highlight?: boolean };

function Platform({
  t,
  platform,
  connected,
  handle,
  rows,
  accent,
}: {
  t: T;
  platform: string;
  connected: boolean;
  handle: string;
  rows: PlatformRow[];
  accent: string;
}) {
  return (
    <div className="relative min-w-0 overflow-hidden rounded-2xl border border-line bg-paper">
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{ background: accent }}
      />
      <div className="p-5 md:p-6">
        <div className="flex items-center justify-between gap-3">
          <h3 className="shrink-0 text-xl font-semibold tracking-tight">
            {platform}
          </h3>
          <span className="min-w-0 truncate font-mono text-[10.5px] uppercase tracking-[0.22em] text-faint">
            {handle}
          </span>
        </div>

        {connected ? (
          <dl className="mt-5 grid min-w-0 grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
            {rows.map((r) => (
              <div
                key={r.label}
                className="flex min-w-0 items-baseline justify-between gap-3 border-b border-line pb-2 last:border-0"
              >
                <dt className="min-w-0 truncate text-[12.5px] text-muted">
                  {r.label}
                </dt>
                <dd
                  className="shrink-0 text-[18px] font-semibold tracking-tight"
                  style={r.highlight ? { color: accent } : undefined}
                >
                  {r.value}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="mt-5 rounded-lg border border-dashed border-line bg-bg/40 px-4 py-5 text-[13px] leading-snug text-muted">
            {t("platform.notConnected")}
          </p>
        )}
      </div>
    </div>
  );
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

// ─────────────────────────────────────────────────────────────────────────────
// 02 · Demographics
// ─────────────────────────────────────────────────────────────────────────────
function Demographics({
  t,
  yt,
  ig,
}: {
  t: T;
  yt: YTDemographics | null;
  ig: IGDemographics | null;
}) {
  const noData = !yt && !ig;

  if (noData) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-paper/60 p-8 text-center">
        <Eyebrow>setup</Eyebrow>
        <p className="mx-auto mt-4 max-w-md text-[14px] leading-relaxed text-muted">
          {t("demo.empty")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {yt && (
        <DemoPanel
          t={t}
          source="YouTube"
          window={t("demo.window")}
          age={yt.age}
          gender={yt.gender.map((g) => ({ key: g.gender, share: g.share }))}
          accent="#A35149"
          geography={yt.geography.map((g) => ({
            key: g.country,
            share: g.share,
          }))}
        />
      )}
      {ig && (
        <DemoPanel
          t={t}
          source="Instagram"
          window={t("demo.window.lifetime")}
          age={ig.age}
          gender={ig.gender.map((g) => ({ key: g.gender, share: g.share }))}
          accent="#FFB162"
          geography={ig.country.map((c) => ({ key: c.country, share: c.share }))}
        />
      )}
    </div>
  );
}

function DemoPanel({
  t,
  source,
  window: windowLabel,
  age,
  gender,
  geography,
  accent,
}: {
  t: T;
  source: string;
  window: string;
  age: { bucket: string; share: number }[];
  gender: { key: string; share: number }[];
  geography: { key: string; share: number }[];
  accent: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-paper">
      <div className="flex items-center justify-between border-b border-line px-5 py-3 md:px-6">
        <h3 className="text-[15px] font-semibold tracking-tight">{source}</h3>
        <span
          className="font-mono text-[10.5px] uppercase tracking-[0.22em]"
          style={{ color: accent }}
        >
          {windowLabel}
        </span>
      </div>
      <div className="grid grid-cols-1 divide-y divide-line md:grid-cols-3 md:divide-x md:divide-y-0">
        <div className="p-5 md:p-6">
          <Eyebrow>{t("demo.age")}</Eyebrow>
          <div className="mt-4 space-y-2">
            {age.length === 0 ? (
              <p className="text-[13px] text-muted">{t("demo.noData")}</p>
            ) : (
              age.map((a) => (
                <Bar
                  key={a.bucket}
                  label={a.bucket}
                  share={a.share}
                  accent={accent}
                />
              ))
            )}
          </div>
        </div>
        <div className="p-5 md:p-6">
          <Eyebrow>{t("demo.gender")}</Eyebrow>
          <div className="mt-4 space-y-2">
            {gender.length === 0 ? (
              <p className="text-[13px] text-muted">{t("demo.noData")}</p>
            ) : (
              gender.map((g) => (
                <Bar
                  key={g.key}
                  label={genderLabel(t, g.key)}
                  share={g.share}
                  accent={accent}
                />
              ))
            )}
          </div>
        </div>
        <div className="p-5 md:p-6">
          <Eyebrow>{t("demo.where")}</Eyebrow>
          <div className="mt-4 space-y-2">
            {geography.length === 0 ? (
              <p className="text-[13px] text-muted">{t("demo.noData")}</p>
            ) : (
              geography.slice(0, 6).map((c) => (
                <Bar
                  key={c.key}
                  label={countryLabel(c.key)}
                  share={c.share}
                  accent={accent}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Bar({
  label,
  share,
  accent,
}: {
  label: string;
  share: number;
  accent: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between text-[12.5px]">
        <span className="text-ink">{label}</span>
        <span className="font-mono text-[11px] text-muted">
          {share.toFixed(1)}%
        </span>
      </div>
      <div className="mt-1.5 h-[5px] overflow-hidden rounded-full bg-bg/70">
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.min(100, share)}%`,
            background: accent,
          }}
        />
      </div>
    </div>
  );
}

function genderLabel(t: T, g: string): string {
  const v = g.toLowerCase();
  if (v.startsWith("f")) return t("gender.f");
  if (v.startsWith("m")) return t("gender.m");
  return t("gender.u");
}

const COUNTRY: Record<string, string> = {
  BR: "Brasil",
  PT: "Portugal",
  US: "Estados Unidos",
  AR: "Argentina",
  AO: "Angola",
  MZ: "Moçambique",
  GB: "Reino Unido",
  ES: "Espanha",
  IT: "Itália",
  DE: "Alemanha",
  FR: "França",
  CA: "Canadá",
  MX: "México",
  CL: "Chile",
  CO: "Colômbia",
  PY: "Paraguai",
  UY: "Uruguai",
  JP: "Japão",
};
function countryLabel(c: string): string {
  return COUNTRY[c.toUpperCase()] ?? c;
}

// ─────────────────────────────────────────────────────────────────────────────
// 03 · Top videos
// ─────────────────────────────────────────────────────────────────────────────
function TopVideos({
  t,
  videos,
  locale,
}: {
  t: T;
  videos: YTVideo[];
  locale: Locale;
}) {
  if (videos.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-paper/60 p-6 text-[13px] text-muted">
        {t("videos.empty")}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-3">
      {videos.map((v, i) => (
        <a
          key={v.id}
          href={v.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group block overflow-hidden rounded-2xl border border-line bg-paper transition-colors hover:border-line-strong"
        >
          <div className="relative aspect-video w-full overflow-hidden bg-indigo">
            <YouTubeHoverPreview
              videoId={v.id}
              thumbnail={v.thumbnail}
              alt={v.title}
            />
            <span className="absolute left-3 top-3 z-10 rounded-full bg-indigo/85 px-2 py-1 font-mono text-[10.5px] uppercase tracking-[0.22em] text-palladian">
              #{(i + 1).toString().padStart(2, "0")}
            </span>
            <span className="absolute bottom-3 right-3 z-10 rounded-full bg-indigo/85 px-2 py-1 font-mono text-[10.5px] text-palladian">
              {fmtDuration(v.durationSec)}
            </span>
          </div>
          <div className="p-3 sm:p-4">
            <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug tracking-tight text-ink group-hover:text-truffle sm:text-[15px]">
              {v.title}
            </h3>
            <div className="mt-2 flex items-baseline justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-faint sm:mt-3 sm:text-[11px] sm:tracking-[0.16em]">
              <span>
                {shortNumber(v.views)} {t("videos.views")}
              </span>
              <span>{fmtRelDate(v.publishedAt, locale)}</span>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 04 · Top IG media
// ─────────────────────────────────────────────────────────────────────────────
function TopMedia({ t, media }: { t: T; media: IGMedia[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-6">
      {media.map((m) => (
        <a
          key={m.id}
          href={m.permalink}
          target="_blank"
          rel="noopener noreferrer"
          className="group block overflow-hidden rounded-xl border border-line bg-paper transition-colors hover:border-line-strong"
        >
          <div className="relative aspect-square w-full overflow-hidden bg-indigo">
            <InstagramHoverPreview
              mediaType={m.mediaType}
              thumbnail={m.thumbnail}
              videoSrc={m.videoSrc}
              alt={m.caption ?? ""}
            />
            <span className="absolute right-2 top-2 z-10 rounded-full bg-indigo/85 px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-palladian">
              {mediaTypeLabel(t, m.mediaType)}
            </span>
          </div>
          <div className="flex items-center justify-between px-3 py-2 font-mono text-[10.5px] uppercase tracking-[0.18em] text-faint">
            <span>♡ {shortNumber(m.likes)}</span>
            <span>{shortNumber(m.comments)}</span>
          </div>
        </a>
      ))}
    </div>
  );
}

function mediaTypeLabel(t: T, type: IGMedia["mediaType"]): string {
  switch (type) {
    case "REELS":
      return t("ig.reel");
    case "VIDEO":
      return t("ig.video");
    case "CAROUSEL_ALBUM":
      return t("ig.carousel");
    default:
      return t("ig.photo");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Sponsors
// ─────────────────────────────────────────────────────────────────────────────
function Sponsors({
  t,
  sponsors,
}: {
  t: T;
  sponsors: SponsorEntry[];
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4">
      {sponsors.map((s) => (
        <article
          key={s.key}
          className="group flex flex-col items-center justify-center gap-4 rounded-2xl border border-line bg-paper p-5 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-sm md:gap-5 md:p-6"
        >
          <SponsorLogo
            brand={s.brand}
            domain={s.domain}
            logoSrc={s.logoSrc}
            color={s.color}
            size="xl"
          />
          <div>
            <div className="text-[15px] font-semibold leading-tight tracking-tight text-ink">
              {s.brand}
            </div>
            {s.videos > 0 && (
              <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-faint">
                {s.videos}{" "}
                {s.videos === 1 ? t("sponsors.video") : t("sponsors.videos")}
              </div>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Services — single-currency, rounded
// ─────────────────────────────────────────────────────────────────────────────
function Services({
  t,
  services,
  locale,
}: {
  t: T;
  services: Service[];
  locale: Locale;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
      {services.map((s, i) => (
        <article
          key={localizedField(s, "name", "en")}
          className="flex flex-col rounded-2xl border border-line bg-paper p-5 md:p-6"
        >
          <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-flame">
            0{i + 1}
          </span>
          <h3 className="mt-4 text-[20px] font-semibold tracking-tight text-ink">
            {localizedField(s, "name", locale)}
          </h3>
          <p className="mt-2 flex-1 text-[13.5px] leading-snug text-muted">
            {localizedField(s, "description", locale)}
          </p>
          <dl className="mt-5 space-y-2 border-t border-line pt-4 font-mono text-[11px] uppercase tracking-[0.16em]">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-faint">{t("service.format")}</dt>
              <dd className="text-muted">
                {localizedField(s, "format", locale)}
              </dd>
            </div>
            <ServicePrice service={s} locale={locale} t={t} />
          </dl>
        </article>
      ))}
    </div>
  );
}

// Single-currency price for a service. Uses canonical value when set in that
// currency, otherwise converts at USD_TO_BRL. Rounded to a tidy magnitude.
function ServicePrice({
  service,
  locale,
  t,
}: {
  service: Service;
  locale: Locale;
  t: T;
}) {
  const { priceBRL, priceUSD } = service;
  if (priceBRL === undefined && priceUSD === undefined) return null;

  let value: number;
  let prefix: string;
  if (locale === "en") {
    value = priceUSD ?? (priceBRL ?? 0) / USD_TO_BRL;
    prefix = "US$";
  } else {
    value = priceBRL ?? (priceUSD ?? 0) * USD_TO_BRL;
    prefix = "R$";
  }
  const rounded = roundTidy(value);

  return (
    <div className="flex items-baseline justify-between gap-3 pt-1">
      <dt className="text-faint">{t("service.priceFrom")}</dt>
      <dd className="text-truffle">
        {prefix} {fmtPrice(rounded, locale)}
      </dd>
    </div>
  );
}

// Round to a "nice" magnitude based on size — 50, 100, 500, 1000.
function roundTidy(n: number): number {
  if (n < 500) return Math.round(n / 50) * 50;
  if (n < 5_000) return Math.round(n / 100) * 100;
  if (n < 50_000) return Math.round(n / 500) * 500;
  return Math.round(n / 1_000) * 1_000;
}

function fmtPrice(n: number, locale: Locale): string {
  return n.toLocaleString(locale === "en" ? "en-US" : "pt-BR");
}

// ─────────────────────────────────────────────────────────────────────────────
// Contact CTA
// ─────────────────────────────────────────────────────────────────────────────
function ContactCTA({
  t,
  config,
}: {
  t: T;
  config: typeof CONFIG;
}) {
  const social: { label: string; handle: string; href: string }[] = [];
  if (config.contact.instagram) {
    social.push({
      label: t("contact.instagram"),
      handle: config.contact.instagram,
      href: `https://instagram.com/${config.contact.instagram.replace(/^@/, "")}`,
    });
  }
  if (config.contact.youtube) {
    social.push({
      label: t("contact.youtube"),
      handle: config.contact.youtube,
      href: `https://youtube.com/${config.contact.youtube}`,
    });
  }
  if (config.contact.whatsapp) {
    social.push({
      label: t("contact.whatsapp"),
      handle: config.contact.whatsapp,
      href: `https://wa.me/${config.contact.whatsapp.replace(/\D/g, "")}`,
    });
  }
  if (config.contact.website) {
    social.push({
      label: t("contact.website"),
      handle: config.contact.website,
      href: config.contact.website,
    });
  }

  return (
    <section className="relative overflow-hidden rounded-3xl border border-line bg-indigo p-8 text-palladian md:p-12">
      <div
        aria-hidden
        className="absolute inset-0 opacity-30"
        style={{
          background:
            "radial-gradient(800px 400px at 80% 20%, rgba(255,177,98,0.4), transparent 60%)",
        }}
      />
      <div className="relative grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-10">
        <div className="md:col-span-7">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.28em] text-flame">
            {t("cta.eyebrow")}
          </div>
          <h2 className="mt-3 text-3xl font-bold leading-[1.05] tracking-[-0.025em] md:text-[44px]">
            {t("cta.title")}
          </h2>

          <CopyEmailButton
            email={config.contact.email}
            copyLabel={t("copy.copy")}
            copiedLabel={t("copy.copied")}
          />
        </div>

        <div className="md:col-span-5">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.28em] text-palladian/60">
            {t("cta.also")}
          </div>
          <ul className="mt-4 space-y-2">
            {social.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-4 border-b border-palladian/15 py-3 text-palladian transition-colors hover:text-flame"
                >
                  <span className="font-mono text-[10.5px] uppercase tracking-[0.28em] text-palladian/60">
                    {s.label}
                  </span>
                  <span className="truncate text-[14px] font-medium tracking-tight">
                    {s.handle}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

// Highlights the channel's core promise — "história real" / "real story" — in
// the intro so the one line that sells the content pops in flame.
function renderWithStoryHighlight(text: string) {
  const parts = text.split(/(história real|real story)/i);
  return parts.map((p, i) =>
    /^(história real|real story)$/i.test(p) ? (
      <span key={i} className="font-semibold text-flame">
        {p}
      </span>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}

// Wraps "IA" / "AI" tokens in a purple gradient span so the AI keyword pops
// in the tagline. Bare word boundaries only — won't touch words like "main".
function renderWithAiHighlight(text: string) {
  const parts = text.split(/\b(IA|AI)\b/);
  return parts.map((p, i) =>
    p === "IA" || p === "AI" ? (
      <span
        key={i}
        className="bg-gradient-to-r from-[#7C3AED] via-[#A855F7] to-[#EC4899] bg-clip-text font-semibold text-transparent"
      >
        {p}
      </span>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function shortNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}k`;
  return n.toString();
}

function fmtDuration(sec: number): string {
  if (!sec) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    return `${h}h${(m % 60).toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function fmtRelDate(iso: string, locale: Locale): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.floor(days / 7)}w`;
  // < 1 year → month name; >= 1 year → year. Both look clean uppercased and
  // don't collide with "M" / "k" used in view counts.
  if (days < 365) {
    return d
      .toLocaleString(locale === "en" ? "en-US" : "pt-BR", { month: "short" })
      .replace(/\.$/, "");
  }
  return String(d.getUTCFullYear());
}
