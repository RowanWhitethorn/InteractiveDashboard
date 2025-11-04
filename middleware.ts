// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PUBLIC_ONLY = new Set(["/sign-in", "/sign-up"]);

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const { pathname } = url;
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (pairs) => {
          for (const { name, value, options } of pairs) {
            // ✅ DO NOT set domain
            res.cookies.set({ name, value, ...options });
          }
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  if (pathname === "/" && !session) {
    url.pathname = "/sign-in";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (session && PUBLIC_ONLY.has(pathname)) {
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = { matcher: ["/", "/sign-in", "/sign-up", "/logout", "/api/:path*"] };
