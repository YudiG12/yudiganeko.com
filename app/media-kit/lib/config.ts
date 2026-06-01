// ─────────────────────────────────────────────────────────────────────────────
// Media kit configuration — standalone copy.
//
// Unlike the dashboard version (which auto-detects sponsors from the kanban
// script DB), this is fully self-contained: brands, contact info, services
// and prices live right here. Edit and re-deploy.
// ─────────────────────────────────────────────────────────────────────────────

export type Locale = "en" | "pt";

export type Service = {
  name: string;
  nameEN?: string;
  description: string;
  descriptionEN?: string;
  format: string;
  formatEN?: string;
  priceBRL?: number;
  priceUSD?: number;
};

export type SponsorEntry = {
  brand: string; // display name
  key: string; // uppercase, used as React key
  videos: number; // 0 hides the count line
  color: string; // accent for the initials fallback
  domain?: string; // favicon source
  logoSrc?: string; // local /public path — wins over favicon
};

export type MediaKitConfig = {
  tagline: string;
  taglineEN: string;
  intro: string;
  introEN: string;
  contact: {
    email: string;
    whatsapp?: string;
    instagram?: string;
    youtube?: string;
    website?: string;
  };
  services: Service[];
  sponsors: SponsorEntry[];
};

// USD → BRL conversion used when one side of a price is missing.
export const USD_TO_BRL = 5.5;

// Hand-curated colour for the initials-fallback puck on each brand. Match the
// dashboard's palette so the page feels coherent.
const COLOR = {
  truffle: "#A35149",
  flame: "#FFB162",
  sage: "#6F8267",
  clay: "#7A6A8A",
  rust: "#C97A6F",
  navy: "#3F5B73",
  patina: "#5B8278",
  stone: "#8A8276",
  terracotta: "#D58867",
};

export const CONFIG: MediaKitConfig = {
  tagline: "Creator tech brasileiro. Programação, IA e creator economy.",
  taglineEN: "Brazilian tech creator. Programming, AI and creator economy.",
  intro:
    "Construo conteúdo prático e raro sobre tecnologia. Cada vídeo é uma história real, com aprendizados que não tem em curso. Audiência fiel de devs e estudantes que querem crescer na área tech.",
  introEN:
    "I make rare, practical tech content. Each video is a real story with takeaways you won't find in any course. A loyal audience of devs and students who want to grow in tech.",
  contact: {
    email: "contato@yudiganeko.com",
    instagram: "@ganekoyudi",
    youtube: "@yudiganeko",
  },
  services: [
    {
      name: "YouTube · dedicado",
      nameEN: "YouTube · dedicated",
      description:
        "Vídeo inteiro sobre a marca, integrado à minha narrativa. Hooks fortes, demonstração real.",
      descriptionEN:
        "Full video about the brand, woven into my own narrative. Strong hooks, real demos.",
      format: "10-15 min, YouTube",
      formatEN: "10-15 min, YouTube",
      priceUSD: 2300,
    },
    {
      name: "YouTube · inserção",
      nameEN: "YouTube · insertion",
      description:
        "Espaço de 60-90s dentro de um vídeo do canal. Apresentação genuína.",
      descriptionEN:
        "60-90s slot inside a channel video. Genuine on-screen pitch.",
      format: "60-90s dentro de um vídeo",
      formatEN: "60-90s inside a video",
      priceUSD: 1100,
    },
    {
      name: "Vídeo vertical",
      nameEN: "Vertical video",
      description:
        "Conteúdo curto em formato vertical pra Reel no Instagram ou Short no YouTube — marca integrada ao feed natural.",
      descriptionEN:
        "Short vertical content for an Instagram Reel or YouTube Short — brand woven into the natural feed.",
      format: "Reel ou Short até 60s",
      formatEN: "Reel or Short up to 60s",
      priceUSD: 300,
    },
  ],
  // Brands that have sponsored a video. Order = priority shown in the
  // marquee. Add new ones at the end (or wherever fits visually).
  sponsors: [
    {
      brand: "AUVP",
      key: "AUVP",
      videos: 8,
      color: COLOR.truffle,
      domain: "auvp.com.br",
    },
    {
      brand: "BITRIX24",
      key: "BITRIX24",
      videos: 2,
      color: COLOR.navy,
      domain: "bitrix24.com",
    },
    {
      brand: "Trae",
      key: "TRAE",
      videos: 2,
      color: COLOR.truffle,
      logoSrc: "/sponsor-logos/trae.png",
    },
    {
      brand: "UniPDS",
      key: "UNIPDS",
      videos: 2,
      color: COLOR.stone,
      logoSrc: "/sponsor-logos/unipds.png",
    },
    {
      brand: "GenSpark",
      key: "GENSPARK",
      videos: 1,
      color: COLOR.rust,
      domain: "genspark.ai",
    },
    {
      brand: "Luma AI",
      key: "LUMA_AI",
      videos: 1,
      color: COLOR.clay,
      logoSrc: "/sponsor-logos/luma-ai.png",
    },
    {
      brand: "Agilize",
      key: "AGILIZE",
      videos: 0,
      color: COLOR.clay,
      logoSrc: "/sponsor-logos/agilize.png",
    },
    {
      brand: "Augusto Galego",
      key: "GALEGO",
      videos: 0,
      color: COLOR.rust,
      logoSrc: "/sponsor-logos/galego.png",
    },
    {
      brand: "eHeadset",
      key: "EHEADSET",
      videos: 0,
      color: COLOR.clay,
      domain: "eheadset.com.br",
    },
    {
      brand: "Filipe Deschamps",
      key: "DESCHAMPS",
      videos: 0,
      color: COLOR.terracotta,
      domain: "filipedeschamps.com.br",
    },
    {
      brand: "Replit",
      key: "REPLIT",
      videos: 0,
      color: COLOR.terracotta,
      domain: "replit.com",
    },
  ],
};

// Pick the English variant of a Service field, falling back to PT when missing.
export function localizedField<K extends "name" | "description" | "format">(
  s: Service,
  field: K,
  locale: Locale,
): string {
  if (locale === "en") {
    const en = s[`${field}EN` as keyof Service];
    if (typeof en === "string" && en.length) return en;
  }
  return s[field];
}
