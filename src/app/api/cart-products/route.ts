import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_IDS = 20;

export async function GET(req: NextRequest) {
  const headers = {
    "Cache-Control": "no-store",
    "X-Robots-Tag": "noindex",
    "Content-Type": "application/json",
  };

  try {
    const rawIds = req.nextUrl.searchParams.get("ids") || "";
    const ids = rawIds
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (ids.length === 0) {
      return NextResponse.json({ products: [] }, { status: 200, headers });
    }

    if (ids.length > MAX_IDS || !ids.every((id) => UUID_REGEX.test(id))) {
      return NextResponse.json({ ok: false }, { status: 503, headers });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) {
      return NextResponse.json({ ok: false }, { status: 503, headers });
    }

    const supabase = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    const { data, error } = await supabase
      .from("jf_products")
      .select("id, title, slug, price, size_ml, images")
      .in("id", ids)
      .eq("is_active", true);

    if (error) {
      return NextResponse.json({ ok: false }, { status: 503, headers });
    }

    const products = (data ?? []).map((p) => ({
      id: p.id as string,
      title: p.title as string,
      slug: p.slug as string,
      price: Number(p.price),
      size_ml: Number(p.size_ml),
      image: Array.isArray(p.images) && p.images[0] ? (p.images[0] as string) : null,
    }));

    return NextResponse.json({ products }, { status: 200, headers });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503, headers });
  }
}
