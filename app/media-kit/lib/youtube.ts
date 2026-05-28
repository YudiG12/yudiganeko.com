// ─────────────────────────────────────────────────────────────────────────────
// YouTube data layer for the media kit.
//
// Two surfaces:
//   1. Public data (Data API v3) — channel stats + top videos. API key only.
//   2. Private data (Analytics API) — demographics, geo. Needs OAuth refresh
//      token from the channel owner.
//
// Both are cached per Next.js render with `revalidate: 3600` (1h). When env
// vars are missing, the fetchers return `null` so the UI can show a "connect"
// CTA instead of crashing.
// ─────────────────────────────────────────────────────────────────────────────

const REVALIDATE = 60 * 60; // 1 hour

const DATA_API = "https://youtube.googleapis.com/youtube/v3";
const ANALYTICS_API = "https://youtubeanalytics.googleapis.com/v2";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

export type YTStats = {
  channelId: string;
  title: string;
  description: string;
  customUrl?: string;
  thumbnail: string;
  subscribers: number;
  totalViews: number;
  videoCount: number;
};

export type YTVideo = {
  id: string;
  title: string;
  publishedAt: string; // ISO
  thumbnail: string;
  views: number;
  likes: number;
  comments: number;
  durationSec: number;
  url: string;
};

export type YTDemographics = {
  age: { bucket: string; share: number }[]; // share is 0..100, sums to ~100
  gender: { gender: "female" | "male" | "user_specified"; share: number }[];
  geography: { country: string; views: number; share: number }[];
};

export type YTEngagement = {
  views: number; // last 365d
  likes: number;
  comments: number;
  shares: number;
  avgViewDurationSec: number;
  avgViewPercentage: number; // 0..100
  subscribersGained: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// Public — Data API v3 (API key)
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchChannelStats(): Promise<YTStats | null> {
  const key = process.env.YOUTUBE_API_KEY;
  const channelId = process.env.YOUTUBE_CHANNEL_ID;
  if (!key || !channelId) return null;

  const url = new URL(`${DATA_API}/channels`);
  url.searchParams.set("part", "snippet,statistics");
  url.searchParams.set("id", channelId);
  url.searchParams.set("key", key);

  const res = await fetch(url, { next: { revalidate: REVALIDATE } });
  if (!res.ok) return null;
  const data = await res.json();
  const item = data.items?.[0];
  if (!item) return null;

  return {
    channelId,
    title: item.snippet.title,
    description: item.snippet.description,
    customUrl: item.snippet.customUrl,
    thumbnail:
      item.snippet.thumbnails?.high?.url ??
      item.snippet.thumbnails?.default?.url ??
      "",
    subscribers: Number(item.statistics.subscriberCount ?? 0),
    totalViews: Number(item.statistics.viewCount ?? 0),
    videoCount: Number(item.statistics.videoCount ?? 0),
  };
}

export async function fetchTopVideos(limit = 6): Promise<YTVideo[]> {
  const key = process.env.YOUTUBE_API_KEY;
  const channelId = process.env.YOUTUBE_CHANNEL_ID;
  if (!key || !channelId) return [];

  // Get the uploads playlist for the channel.
  const chUrl = new URL(`${DATA_API}/channels`);
  chUrl.searchParams.set("part", "contentDetails");
  chUrl.searchParams.set("id", channelId);
  chUrl.searchParams.set("key", key);
  const chRes = await fetch(chUrl, { next: { revalidate: REVALIDATE } });
  if (!chRes.ok) return [];
  const ch = await chRes.json();
  const uploadsId: string | undefined =
    ch.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsId) return [];

  // Pull up to 50 most recent uploads.
  const plUrl = new URL(`${DATA_API}/playlistItems`);
  plUrl.searchParams.set("part", "contentDetails");
  plUrl.searchParams.set("playlistId", uploadsId);
  plUrl.searchParams.set("maxResults", "50");
  plUrl.searchParams.set("key", key);
  const plRes = await fetch(plUrl, { next: { revalidate: REVALIDATE } });
  if (!plRes.ok) return [];
  const pl = await plRes.json();
  const ids: string[] = (pl.items ?? [])
    .map((i: { contentDetails?: { videoId?: string } }) => i.contentDetails?.videoId)
    .filter(Boolean);
  if (ids.length === 0) return [];

  // Get full stats for each video.
  const vUrl = new URL(`${DATA_API}/videos`);
  vUrl.searchParams.set("part", "snippet,statistics,contentDetails");
  vUrl.searchParams.set("id", ids.join(","));
  vUrl.searchParams.set("key", key);
  const vRes = await fetch(vUrl, { next: { revalidate: REVALIDATE } });
  if (!vRes.ok) return [];
  const v = await vRes.json();

  const videos: YTVideo[] = (v.items ?? []).map(
    (it: {
      id: string;
      snippet: {
        title: string;
        publishedAt: string;
        thumbnails: Record<string, { url: string }>;
      };
      statistics: { viewCount?: string; likeCount?: string; commentCount?: string };
      contentDetails: { duration: string };
    }) => ({
      id: it.id,
      title: it.snippet.title,
      publishedAt: it.snippet.publishedAt,
      thumbnail:
        it.snippet.thumbnails?.maxres?.url ??
        it.snippet.thumbnails?.high?.url ??
        it.snippet.thumbnails?.medium?.url ??
        "",
      views: Number(it.statistics.viewCount ?? 0),
      likes: Number(it.statistics.likeCount ?? 0),
      comments: Number(it.statistics.commentCount ?? 0),
      durationSec: parseISODuration(it.contentDetails.duration),
      url: `https://www.youtube.com/watch?v=${it.id}`,
    }),
  );

  videos.sort((a, b) => b.views - a.views);
  return videos.slice(0, limit);
}

// ISO 8601 duration → seconds (e.g. "PT12M34S" → 754).
function parseISODuration(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  const [, h, mn, s] = m;
  return Number(h ?? 0) * 3600 + Number(mn ?? 0) * 60 + Number(s ?? 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// Private — Analytics API (OAuth refresh token)
// ─────────────────────────────────────────────────────────────────────────────

// Exchange the long-lived refresh token for a short-lived access token.
async function getAnalyticsAccessToken(): Promise<string | null> {
  const id = process.env.YOUTUBE_CLIENT_ID;
  const secret = process.env.YOUTUBE_CLIENT_SECRET;
  const refresh = process.env.YOUTUBE_REFRESH_TOKEN;
  if (!id || !secret || !refresh) return null;

  const body = new URLSearchParams({
    client_id: id,
    client_secret: secret,
    refresh_token: refresh,
    grant_type: "refresh_token",
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    next: { revalidate: REVALIDATE },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.access_token ?? null;
}

// Default window: last 365 days. Format: YYYY-MM-DD.
function defaultWindow(days = 365): { start: string; end: string } {
  const end = new Date();
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - days);
  const f = (d: Date) => d.toISOString().slice(0, 10);
  return { start: f(start), end: f(end) };
}

async function queryAnalytics(
  token: string,
  dimensions: string,
  metrics: string,
  sort?: string,
  maxResults?: number,
): Promise<{ columnHeaders: { name: string }[]; rows: (string | number)[][] } | null> {
  const { start, end } = defaultWindow();
  const url = new URL(`${ANALYTICS_API}/reports`);
  url.searchParams.set("ids", "channel==MINE");
  url.searchParams.set("startDate", start);
  url.searchParams.set("endDate", end);
  url.searchParams.set("metrics", metrics);
  url.searchParams.set("dimensions", dimensions);
  if (sort) url.searchParams.set("sort", sort);
  if (maxResults) url.searchParams.set("maxResults", String(maxResults));

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: REVALIDATE },
  });
  if (!res.ok) return null;
  return (await res.json()) as {
    columnHeaders: { name: string }[];
    rows: (string | number)[][];
  };
}

export async function fetchDemographics(): Promise<YTDemographics | null> {
  const token = await getAnalyticsAccessToken();
  if (!token) return null;

  const [ageGender, geo] = await Promise.all([
    queryAnalytics(token, "ageGroup,gender", "viewerPercentage"),
    queryAnalytics(
      token,
      "country",
      "views",
      "-views",
      8,
    ),
  ]);

  if (!ageGender && !geo) return null;

  // age + gender share — analytics returns rows of [ageGroup, gender, percentage].
  const ageMap = new Map<string, number>();
  const genderMap = new Map<string, number>();
  for (const row of ageGender?.rows ?? []) {
    const [ageGroup, gender, pct] = row as [string, string, number];
    ageMap.set(ageGroup, (ageMap.get(ageGroup) ?? 0) + pct);
    genderMap.set(gender, (genderMap.get(gender) ?? 0) + pct);
  }

  const age = Array.from(ageMap.entries())
    .map(([bucket, share]) => ({
      // analytics gives "age25-34" → "25-34"
      bucket: bucket.replace(/^age/, ""),
      share: round1(share),
    }))
    .sort((a, b) => ageOrder(a.bucket) - ageOrder(b.bucket));

  const gender = Array.from(genderMap.entries())
    .map(([g, share]) => ({
      gender: g.toLowerCase() as YTDemographics["gender"][number]["gender"],
      share: round1(share),
    }))
    .filter((g) => g.share > 0);

  const totalGeoViews = (geo?.rows ?? []).reduce(
    (a, r) => a + (r[1] as number),
    0,
  );
  const geography = (geo?.rows ?? []).map(
    (r) =>
      ({
        country: r[0] as string,
        views: r[1] as number,
        share: totalGeoViews ? round1(((r[1] as number) / totalGeoViews) * 100) : 0,
      }) as YTDemographics["geography"][number],
  );

  return { age, gender, geography };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

const AGE_ORDER = [
  "13-17",
  "18-24",
  "25-34",
  "35-44",
  "45-54",
  "55-64",
  "65-",
];
function ageOrder(b: string): number {
  const i = AGE_ORDER.indexOf(b);
  return i < 0 ? 99 : i;
}

// Channel-wide engagement aggregates over the last 30 days. The shorter
// window matches what tools like beacons.ai display — recent activity, not a
// year-long average that dilutes engagement with old views.
export async function fetchYTEngagement(): Promise<YTEngagement | null> {
  const token = await getAnalyticsAccessToken();
  if (!token) return null;

  const { start, end } = defaultWindow(30);
  const url = new URL(`${ANALYTICS_API}/reports`);
  url.searchParams.set("ids", "channel==MINE");
  url.searchParams.set("startDate", start);
  url.searchParams.set("endDate", end);
  url.searchParams.set(
    "metrics",
    "views,likes,comments,shares,averageViewDuration,averageViewPercentage,subscribersGained",
  );

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: REVALIDATE },
  });
  if (!res.ok) return null;

  const data = (await res.json()) as {
    columnHeaders: { name: string }[];
    rows: number[][];
  };
  const row = data.rows?.[0];
  if (!row) return null;
  const cols = data.columnHeaders.map((c) => c.name);
  const col = (k: string) => row[cols.indexOf(k)] ?? 0;

  return {
    views: Number(col("views")),
    likes: Number(col("likes")),
    comments: Number(col("comments")),
    shares: Number(col("shares")),
    avgViewDurationSec: Number(col("averageViewDuration")),
    avgViewPercentage: Number(col("averageViewPercentage")),
    subscribersGained: Number(col("subscribersGained")),
  };
}
