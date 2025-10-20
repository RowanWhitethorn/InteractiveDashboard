import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Paths we want to treat as public (no auth required)
const PUBLIC_ONLY = new Set(["/sign-in", "/sign-up"]);

// Paths that require authentication (add/remove to match your app)
const PROTECTED_PREFIXES = [ "/", "/app", "/projects", "/admin"]; // keep even if some don't exist yet

function isProtected(pathname: string) {
  // raíz exacta o prefijos con subrutas
  return (
    pathname === "/" ||
    PROTECTED_PREFIXES.some((p) => p !== "/" && (pathname === p || pathname.startsWith(p + "/")))
  );
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => {
            res.cookies.set({ name, value, ...options });
          });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  const url = req.nextUrl.clone();
  const { pathname, searchParams } = url;

  // 1) If route is protected and there's no session, send to /sign-in with ?next=...
  if (isProtected(pathname) && !session) {
    url.pathname = "/sign-in";
    url.searchParams.set("next", pathname + (req.nextUrl.search || ""));
    return NextResponse.redirect(url);
  }

  // 2) If already signed in and trying to visit /sign-in or /sign-up, send to next or /app
  if (session && PUBLIC_ONLY.has(pathname)) {
    const next = searchParams.get("next") || "/app";
    url.pathname = next;
    url.search = ""; // clean query when redirecting
    return NextResponse.redirect(url);
  }

  // otherwise proceed
  return res;
}

// Match only the routes we actually care about to keep this fast at the edge
export const config = {
  matcher: [
    "/",
    "/sign-in",
    "/sign-up",
    "/app/:path*",
    "/projects/:path*",
    "/admin/:path*",
  ],
};
