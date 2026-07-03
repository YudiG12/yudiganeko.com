import type { NextConfig } from "next";

// Projeto separado (repo mentoria-form) servido sob /mentoria* neste domínio.
const MENTORIA = "https://mentoria-form.vercel.app";

// Projeto separado (repo email-marketing) servido sob /download/* neste domínio.
const EMAIL_MARKETING = "https://yudi-ganeko-email-marketing.vercel.app";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // páginas
      { source: "/mentoria", destination: `${MENTORIA}/mentoria` },
      { source: "/mentoria-form", destination: `${MENTORIA}/mentoria-form` },
      { source: "/mentoria-admin", destination: `${MENTORIA}/mentoria-admin` },
      // backend do formulário/admin (mesma origem -> cookies funcionam)
      { source: "/api/lead", destination: `${MENTORIA}/api/lead` },
      { source: "/api/submit", destination: `${MENTORIA}/api/submit` },
      { source: "/api/admin/:path*", destination: `${MENTORIA}/api/admin/:path*` },
      // email-marketing: páginas de download + assets (_next) sob o mesmo prefixo
      { source: "/download", destination: `${EMAIL_MARKETING}/download` },
      { source: "/download/:path*", destination: `${EMAIL_MARKETING}/download/:path*` },
    ];
  },
};

export default nextConfig;
