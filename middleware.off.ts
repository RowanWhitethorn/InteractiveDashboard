// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PUBLIC_ONLY = new Set(["/sign-in", "/sign-up"]);

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const url = req.nextUrl.clone();
  const { pathname } = url;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll(cookies) { cookies.forEach(({ name, value, options }) => {
          res.cookies.set({ name, value, ...options });
        }); },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  // Protege solo el dashboard raíz
  if (pathname === "/" && !session) {
    url.pathname = "/sign-in";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Si ya está logueado, evita que vea sign-in/sign-up
  if (session && PUBLIC_ONLY.has(pathname)) {
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: ["/", "/sign-in", "/sign-up", "/logout", "/api/:path*"],
};
