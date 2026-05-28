// ─────────────────────────────────────────────────────────────────────────────
// Instagram data — via "Instagram API with Instagram Login" (graph.instagram.com).
// Sem Facebook Page no caminho.
//
// Requer:
//   INSTAGRAM_ACCESS_TOKEN — token long-lived (60 dias) gerado por
//                            scripts/auth-instagram.ts
//
// Cache de 1h por request. Tudo retorna null se faltar o token.
// ─────────────────────────────────────────────────────────────────────────────

const REVALIDATE = 60 * 60;
const GRAPH = "https://graph.instagram.com/v21.0";

export type IGProfile = {
  id: string;
  username: string;
  name?: string;
  biography?: string;
  followers: number;
  follows: number;
  mediaCount: number;
  profilePicture?: string;
  website?: string;
};

export type IGMedia = {
  id: string;
  permalink: string;
  mediaType: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM" | "REELS";
  thumbnail: string;
  videoSrc?: string; // mp4 url for VIDEO/REELS — used for hover preview
  caption?: string;
  timestamp: string; // ISO
  likes: number;
  comments: number;
  views?: number;
};

export type IGEngagement = {
  avgLikes: number;
  avgComments: number;
  postsSampled: number;
};

export type IGDemographics = {
  // share is 0..100, sums to ~100 within each dimension
  age: { bucket: string; share: number }[];
  gender: { gender: "F" | "M" | "U"; share: number }[];
  country: { country: string; share: number }[];
  city: { city: string; share: number }[];
};

function token(): string | null {
  return process.env.INSTAGRAM_ACCESS_TOKEN ?? null;
}

async function ig<T>(
  path: string,
  params: Record<string, string>,
): Promise<T | null> {
  const t = token();
  if (!t) return null;
  const url = new URL(`${GRAPH}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("access_token", t);
  const res = await fetch(url, { next: { revalidate: REVALIDATE } });
  if (!res.ok) return null;
  return (await res.json()) as T;
}

// ─────────────────────────────────────────────────────────────────────────────
// Profile — /me with the public fields available on the IG with IG Login API.
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchIGProfile(): Promise<IGProfile | null> {
  if (!token()) return null;

  const data = await ig<{
    id: string;
    username: string;
    name?: string;
    biography?: string;
    followers_count?: number;
    follows_count?: number;
    media_count?: number;
    profile_picture_url?: string;
    website?: string;
  }>("me", {
    fields:
      "id,username,name,biography,followers_count,follows_count,media_count,profile_picture_url,website",
  });
  if (!data) return null;

  return {
    id: data.id,
    username: data.username,
    name: data.name,
    biography: data.biography,
    followers: data.followers_count ?? 0,
    follows: data.follows_count ?? 0,
    mediaCount: data.media_count ?? 0,
    profilePicture: data.profile_picture_url,
    website: data.website,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Top media — fetches recent media and sorts by likes.
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchIGTopMedia(limit = 6): Promise<IGMedia[]> {
  if (!token()) return [];

  const data = await ig<{
    data?: {
      id: string;
      permalink: string;
      media_type: IGMedia["mediaType"];
      media_url?: string;
      thumbnail_url?: string;
      caption?: string;
      timestamp: string;
      like_count?: number;
      comments_count?: number;
    }[];
  }>("me/media", {
    fields:
      "id,permalink,media_type,media_url,thumbnail_url,caption,timestamp,like_count,comments_count",
    limit: "50",
  });
  if (!data?.data) return [];

  const media = data.data.map((m): IGMedia => {
    const isVideo = m.media_type === "VIDEO" || m.media_type === "REELS";
    return {
      id: m.id,
      permalink: m.permalink,
      mediaType: m.media_type,
      // For videos, thumbnail_url is the cover image; media_url is the .mp4.
      // For images, media_url is the .jpg; there's no separate thumbnail.
      thumbnail: m.thumbnail_url || (isVideo ? "" : m.media_url ?? "") || m.media_url || "",
      videoSrc: isVideo ? m.media_url : undefined,
      caption: m.caption,
      timestamp: m.timestamp,
      likes: m.like_count ?? 0,
      comments: m.comments_count ?? 0,
    };
  });

  media.sort((a, b) => b.likes - a.likes);
  return media.slice(0, limit);
}

// ─────────────────────────────────────────────────────────────────────────────
// Audience demographics — /me/insights with follower_demographics.
//
// The IG-with-Login API requires *one breakdown per call* (combining
// `breakdown=age,gender,country,city` returns an "unknown error"). So we
// fire one request per dimension in parallel.
// ─────────────────────────────────────────────────────────────────────────────
type InsightsResponse = {
  data?: {
    name: string;
    total_value?: {
      breakdowns?: {
        dimension_keys: string[];
        results: { dimension_values: string[]; value: number }[];
      }[];
    };
  }[];
};

async function fetchBreakdown(
  dimension: "age" | "gender" | "country" | "city",
): Promise<{ key: string; share: number; count: number }[]> {
  const data = await ig<InsightsResponse>("me/insights", {
    metric: "follower_demographics",
    period: "lifetime",
    metric_type: "total_value",
    breakdown: dimension,
  });
  const b = data?.data?.[0]?.total_value?.breakdowns?.[0];
  if (!b) return [];
  const idx = b.dimension_keys.indexOf(dimension);
  if (idx < 0) return [];
  const total = b.results.reduce((a, r) => a + r.value, 0);
  return b.results
    .map((r) => ({
      key: r.dimension_values[idx],
      count: r.value,
      share: total ? round1((r.value / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

export async function fetchIGDemographics(): Promise<IGDemographics | null> {
  if (!token()) return null;

  const [age, gender, country, city] = await Promise.all([
    fetchBreakdown("age"),
    fetchBreakdown("gender"),
    fetchBreakdown("country"),
    fetchBreakdown("city"),
  ]);

  if (age.length === 0 && gender.length === 0 && country.length === 0) return null;

  // Sort age buckets in natural order (13-17 → 65+), and keep gender as F, M, U.
  // Country/city stay sorted by count (top first).
  const ageSorted = [...age].sort(
    (a, b) => ageOrder(a.key) - ageOrder(b.key),
  );
  const genderSorted = [...gender].sort(
    (a, b) => GENDER_ORDER.indexOf(a.key) - GENDER_ORDER.indexOf(b.key),
  );

  return {
    age: ageSorted.map((r) => ({ bucket: r.key, share: r.share })),
    gender: genderSorted.map((r) => ({
      gender: r.key as IGDemographics["gender"][number]["gender"],
      share: r.share,
    })),
    country: country.slice(0, 8).map((r) => ({ country: r.key, share: r.share })),
    city: city.slice(0, 8).map((r) => ({ city: r.key, share: r.share })),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Engagement — average likes/comments across up to the last 50 posts.
// Caller computes the rate as (avg + avg) / followers when followers is known.
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchIGEngagement(): Promise<IGEngagement | null> {
  if (!token()) return null;

  const data = await ig<{
    data?: { like_count?: number; comments_count?: number }[];
  }>("me/media", {
    fields: "like_count,comments_count",
    limit: "50",
  });
  const items = data?.data ?? [];
  if (items.length === 0) return null;

  const totalLikes = items.reduce((a, m) => a + (m.like_count ?? 0), 0);
  const totalComments = items.reduce((a, m) => a + (m.comments_count ?? 0), 0);

  return {
    avgLikes: Math.round(totalLikes / items.length),
    avgComments: Math.round(totalComments / items.length),
    postsSampled: items.length,
  };
}

const AGE_ORDER = ["13-17", "18-24", "25-34", "35-44", "45-54", "55-64", "65+", "65-"];
function ageOrder(b: string): number {
  const i = AGE_ORDER.indexOf(b);
  return i < 0 ? 99 : i;
}
const GENDER_ORDER = ["F", "M", "U"];

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
