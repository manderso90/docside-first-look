import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // E2E runs two dev servers against isolated build dirs (playwright.config.ts);
  // unset everywhere else, so Vercel and local dev keep the default .next.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  async headers() {
    return [
      {
        // Every page: never index, never leak invite codes via referrer
        // (BRIEF §10 AD-3 leak-prevention; this is a private research experience).
        source: "/:path*",
        headers: [
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
        ],
      },
    ];
  },
};

export default nextConfig;
