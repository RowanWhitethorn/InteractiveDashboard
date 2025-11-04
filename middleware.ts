import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PUBLIC_ONLY = new Set(["/sign-in", "/sign-up"]);

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const { pathname } = url;

  const res = NextResponse.next();
  
  // Determine the domain dynamically based on the environment
  const domain = process.env.NODE_ENV === 'production' ? 'yourdomain.com' : 'localhost';

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookies) => {
          cookies.forEach(({ name, value, options }) => {
            // Ensure cookies have the correct path and domain
            res.cookies.set({
              name, 
              value, 
              path: '/', 
              domain,   // Use dynamic domain
              secure: process.env.NODE_ENV === 'production', // Enable 'secure' flag in production
              ...options 
            });
          });
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
