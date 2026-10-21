import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ToastProvider } from "@/components/ui/toast";
import "@fontsource-variable/bricolage-grotesque";
import "./globals.css";
import { siteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "Sales Scout", template: "%s · Sales Scout" },
  openGraph: { type: "website", siteName: "Sales Scout", title: "Sales Scout — AI sales intelligence, done for you", description: "Find the companies that need what you sell. Researched, vetted and explained." },
  twitter: { card: "summary_large_image" },
  description: "Tell us what you sell. We'll help you figure out who needs it, who to talk to, and what to do next.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eef1f6" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1220" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
