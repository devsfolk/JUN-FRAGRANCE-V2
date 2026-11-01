import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export function GET(request: NextRequest) {
  const country = request.headers.get("x-vercel-ip-country") ?? null;
  return NextResponse.json({ country }, { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
}
