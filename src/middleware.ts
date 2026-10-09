import { NextResponse, type NextRequest } from "next/server";

const PUBLIC = ["/platform", "/why-us", "/how-it-works", "/services", "/contact", "/login", "/signup", "/_next", "/favicon", "/brand", "/api/health"];

/** Cheap gate: bounce requests without a session cookie. Real validation happens server-side. */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/" || PUBLIC.some((p) => pathname.startsWith(p))) return NextResponse.next();
  if (!req.cookies.get("ss_session")) {
    if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"] };
