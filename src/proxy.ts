import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ROBOTS_HEADER = "noindex, nofollow";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  response.headers.set("X-Robots-Tag", ROBOTS_HEADER);

  if (request.nextUrl.pathname === "/dashboard/login") {
    return response;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
        response.headers.set("X-Robots-Tag", ROBOTS_HEADER);
      },
    },
  });

  const { data, error } = await supabase.auth.getClaims();
  if (error || typeof data?.claims.sub !== "string") {
    return redirectToLogin(request, response);
  }

  return response;
}

function redirectToLogin(request: NextRequest, response: NextResponse) {
  const redirectResponse = NextResponse.redirect(new URL("/dashboard/login", request.url));
  response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
  redirectResponse.headers.set("X-Robots-Tag", ROBOTS_HEADER);
  return redirectResponse;
}

export const config = {
  matcher: ["/dashboard/:path*"],
};