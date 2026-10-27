import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const headers = {
    "X-Robots-Tag": "noindex",
    "Cache-Control": "no-store",
    "Content-Type": "application/json",
  };

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anon) {
      return NextResponse.json({ ok: false }, { status: 503, headers });
    }

    const supabase = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    const { error } = await supabase
      .from("jf_settings")
      .select("key")
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ ok: false }, { status: 503, headers });
    }

    return NextResponse.json({ ok: true }, { status: 200, headers });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503, headers });
  }
}
