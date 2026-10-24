import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

const PAGES = ["", "/start", "/book", "/privacy", "/terms"];

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.map((p) => ({ url: `${siteUrl()}${p}`, changeFrequency: "monthly", priority: p === "" ? 1 : 0.7 }));
}
