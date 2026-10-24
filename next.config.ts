import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  // Baseline CSP that doesn't need per-request nonces: no framing, plugins or foreign form posts.
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ["better-sqlite3", "exceljs", "unpdf", "mammoth"],
  devIndicators: { position: "bottom-right" },
  experimental: {
    serverActions: { bodySizeLimit: "20mb" },
  },
  // The prospecting-service pages were retired when the site moved to problem intake.
  async redirects() {
    return [
      { source: "/contact", destination: "/book", permanent: true },
      { source: "/how-it-works", destination: "/#how", permanent: true },
      { source: "/services", destination: "/#how", permanent: true },
      { source: "/platform", destination: "/", permanent: true },
      { source: "/why-us", destination: "/#approach", permanent: true },
    ];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
