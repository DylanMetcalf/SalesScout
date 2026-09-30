"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui", display: "grid", placeItems: "center", minHeight: "100vh", margin: 0 }}>
        <div style={{ textAlign: "center", maxWidth: 420 }}>
          <h1 style={{ fontSize: 20 }}>Something went wrong</h1>
          <p style={{ color: "#5a5d64" }}>Sales Scout hit an unexpected error. Your data is safe.</p>
          <button onClick={reset} style={{ marginTop: 12, padding: "8px 14px", borderRadius: 8, border: "1px solid #ddd", background: "#fff" }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
