import { ImageResponse } from "next/og";

export const alt = "Sales Scout — AI sales intelligence, done for you";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Link-preview card in the Scout Night brand. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          color: "#fff",
          background: "radial-gradient(90% 120% at 100% 0%, rgba(47,197,192,0.35), transparent 60%), linear-gradient(135deg, #16203a 0%, #1b2c52 55%, #144858 100%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="64" height="64" viewBox="0 0 32 32">
            <rect width="32" height="32" rx="8" fill="#0f8285" />
            <path d="M20.5 8.5h-6.2a3.3 3.3 0 0 0 0 6.6h3.4a3.3 3.3 0 0 1 0 6.6H11.5" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontSize: 40, fontWeight: 700 }}>Sales Scout</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <span style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.05, maxWidth: 950 }}>Find the companies that need what you sell.</span>
          <span style={{ fontSize: 32, color: "#b6bfd5" }}>Researched, vetted and explained. AI sales intelligence, done for you.</span>
        </div>
      </div>
    ),
    size,
  );
}
