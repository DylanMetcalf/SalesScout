import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/home", "/discover", "/prospects", "/pipeline", "/follow-ups", "/company", "/settings", "/admin", "/onboarding", "/reports", "/switch", "/opportunities", "/start/received", "/b/"] },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
