import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Paths we want to treat as public (no auth required)
const PUBLIC_ONLY = new Set(["/sign-in", "/sign-up"]);

// Paths that require authentication (add/remove to match your app)
const PROTECTED_PREFIXES = ["/", "/projects", "/admin"];

function isProtected(pathname: string) {
  // raíz exacta o prefijos con subrutas
  return (
    pathname === "/" ||
    PROTECTED_PREFIXES.some((p) => p !== "/" && (pathname === p || pathname.startsWith(p + "/")))
  );
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const url = req.nextUrl.clone();
  const { pathname, searchParams } = url;

  // --- Normalize ONLY auth typos here (single redirect, no 404 spam)
  // /signin → /sign-in
  if (pathname === "/signin") {
    url.pathname = "/sign-in";
    return NextResponse.redirect(url);
  }
  // /signup → /sign-up
  if (pathname === "/signup") {
    url.pathname = "/sign-up";
    return NextResponse.redirect(url);
  }
  // any /sign-* that is NOT exactly /sign-in or /sign-up → /sign-in
  if (pathname.startsWith("/sign-") && pathname !== "/sign-in" && pathname !== "/sign-up") {
    url.pathname = "/sign-in";
    return NextResponse.redirect(url);
  }

  // --- Normalize auth typos up-front so the URL actually changes (no 404 spam)
  // /sign-* that isn't exactly /sign-in or /sign-up  → /sign-in
  if (pathname.startsWith("/sign-") && pathname !== "/sign-in" && pathname !== "/sign-up") {
    url.pathname = "/sign-in";
    return NextResponse.redirect(url);
  }
  // common aliases
  if (pathname === "/signin") {
    url.pathname = "/sign-in";
    return NextResponse.redirect(url);
  }
  if (pathname === "/signup") {
    url.pathname = "/sign-up";
    return NextResponse.redirect(url);
  }

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

  // 1) If route is protected and there's no session, send to /sign-in with ?next=...
  if (isProtected(pathname) && !session) {
    url.pathname = "/sign-in";
    url.searchParams.set("next", pathname + (req.nextUrl.search || ""));
    return NextResponse.redirect(url);
  }

  // 2) If already signed in and trying to visit /sign-in or /sign-up, send to next or /app
  if (session && PUBLIC_ONLY.has(pathname)) {
    const next = searchParams.get("next") || "/";
    url.pathname = next;
    url.search = ""; // clean query when redirecting
    return NextResponse.redirect(url);
  }

  // otherwise proceed
  return res;
}

// Match only the routes we actually care about to keep this fast at the edge
export const config = {
matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
 };