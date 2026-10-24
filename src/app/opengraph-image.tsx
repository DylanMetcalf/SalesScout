import { ImageResponse } from "next/og";

export const alt = "Sales Scout: tell us what’s slowing your business down";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Link-preview card in the Signal brand: Deep Ink, Signal Cobalt, Electric Cyan. */
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
          color: "#f4f7fb",
          backgroundColor: "#0b1220",
          backgroundImage: "radial-gradient(60% 80% at 90% 0%, rgba(49,94,251,0.45), transparent 65%), radial-gradient(40% 60% at 100% 100%, rgba(67,217,255,0.12), transparent 60%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="64" height="64" viewBox="0 0 32 32">
            <rect width="32" height="32" rx="8" fill="#17263d" />
            <path d="M8 13V8h5M19 8h5v5M24 19v5h-5M13 24H8v-5" fill="none" stroke="#f4f7fb" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="16" cy="16" r="3" fill="#43d9ff" />
          </svg>
          <span style={{ fontSize: 40, fontWeight: 600, letterSpacing: -1 }}>Sales Scout</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <span style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2.5, maxWidth: 950 }}>What’s slowing your business down?</span>
          <span style={{ fontSize: 32, color: "#a9b6cc" }}>Tell us what’s not working. We’ll explore it and show you what a solution could look like.</span>
        </div>
      </div>
    ),
    size,
  );
}
