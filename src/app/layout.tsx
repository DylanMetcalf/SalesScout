import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ToastProvider } from "@/components/ui/toast";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource/instrument-serif/latin-400-italic.css";
import "./globals.css";
import { siteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "Sales Scout", template: "%s · Sales Scout" },
  openGraph: { type: "website", siteName: "Sales Scout", title: "Sales Scout: tell us what’s not working", description: "Tell us what’s slowing your business down. We’ll help you find a practical way forward with software, AI or automation." },
  twitter: { card: "summary_large_image" },
  description: "Tell us what’s slowing your business down. We’ll help you understand the problem and find a practical way forward with software, AI or automation.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f1ea" },
    { media: "(prefers-color-scheme: dark)", color: "#111116" },
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
