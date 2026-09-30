import { NextResponse, type NextRequest } from "next/server";
import { getTenant } from "@/lib/tenant";
import { switchCompany } from "@/lib/services/accounts";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const tenant = await getTenant();
  if (!tenant) return NextResponse.redirect(new URL("/login", req.url));
  try {
    switchCompany(tenant, (await params).id);
  } catch {
    /* not accessible: stay where we are */
  }
  return NextResponse.redirect(new URL("/home", req.url));
}
