// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PUBLIC_ONLY = new Set(["/sign-in", "/sign-up"]);

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const url = req.nextUrl.clone();
  const { pathname } = url;

  const isProd = process.env.NODE_ENV === "production";

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (pairs) => {
          for (const { name, value, options } of pairs) {
            // Start from Supabase options, then apply safe defaults
            const merged: Parameters<typeof res.cookies.set>[0] & any = {
              name,
              value,
              ...options,
            };

            // Safe defaults that won't fight Supabase:
            if (merged.path == null) merged.path = "/";
            if (merged.sameSite == null) merged.sameSite = "lax";
            if (isProd) merged.secure = true; // always secure in prod
            // IMPORTANT: do NOT set 'domain' unless you know you need it

            res.cookies.set(merged);
          }
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Guard the dashboard root
  if (pathname === "/" && !session) {
    url.pathname = "/sign-in";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Prevent logged-in users from visiting sign-in / sign-up
  if (session && PUBLIC_ONLY.has(pathname)) {
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return res;
}

// Keep middleware focused on pages that actually need it.
// You can remove "/api/:path*" unless you truly need cookie handling there.
export const config = {
  matcher: ["/", "/sign-in", "/sign-up", "/logout"],
  // If you really must include APIs, add them explicitly (e.g. "/api/auth/:path*")
};
