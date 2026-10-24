import { ImageResponse } from "next/og";

export const alt = "Sales Scout: tell us what’s slowing your business down";
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
          backgroundColor: "#121218",
          backgroundImage: "radial-gradient(70% 90% at 100% 0%, rgba(232,73,42,0.35), transparent 60%), radial-gradient(60% 80% at 0% 100%, rgba(232,73,42,0.12), transparent 60%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="64" height="64" viewBox="0 0 32 32">
            <rect width="32" height="32" rx="8" fill="#fffdf8" />
            <path d="M20.5 8.5h-6.2a3.3 3.3 0 0 0 0 6.6h3.4a3.3 3.3 0 0 1 0 6.6H11.5" fill="none" stroke="#16161d" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="20.5" cy="8.5" r="2.1" fill="#fffdf8" stroke="#16161d" strokeWidth="1.5" />
            <circle cx="11.5" cy="21.7" r="2.5" fill="#e8492a" />
          </svg>
          <span style={{ fontSize: 40, fontWeight: 700 }}>Sales Scout</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <span style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.05, maxWidth: 950 }}>What’s slowing your business down?</span>
          <span style={{ fontSize: 32, color: "#bab6ad" }}>Tell us what’s not working. We’ll explore it and show you what a solution could look like.</span>
        </div>
      </div>
    ),
    size,
  );
}
