import type { NextConfig } from "next";

// Projeto separado (repo mentoria-form) servido sob /mentoria* neste domínio.
const MENTORIA = "https://mentoria-form.vercel.app";

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
    ];
  },
};

export default nextConfig;
