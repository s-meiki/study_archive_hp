/** @type {import("next").NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  outputFileTracingRoot: process.cwd(),
  async redirects() {
    // 旧IA → 新IA の恒久リダイレクト。共有済みリンク・ブックマーク保護のため
    // 本番置き換え後も維持する（noindex サイトなので SEO 影響は軽微）。
    return [
      {
        source: "/archive",
        has: [{ type: "query", key: "id", value: "(?<id>.+)" }],
        destination: "/archives/:id",
        permanent: true
      },
      { source: "/archive", destination: "/archives", permanent: true },
      {
        source: "/archive/index.html",
        has: [{ type: "query", key: "id", value: "(?<id>.+)" }],
        destination: "/archives/:id",
        permanent: true
      },
      { source: "/archive/index.html", destination: "/archives", permanent: true },
      { source: "/learn", destination: "/dashboard", permanent: true },
      { source: "/annual-meetings-2026", destination: "/calendar", permanent: true },
      { source: "/annual-meetings-2026.html", destination: "/calendar", permanent: true },
      { source: "/index.html", destination: "/", permanent: true }
    ];
  }
};

export default nextConfig;
