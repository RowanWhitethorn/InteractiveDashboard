// src/app/api/auth/signout/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function POST() {
  const res = new NextResponse(null, { status: 204 }); // No content, successful sign-out

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: (pairs) => {
          pairs.forEach(({ name, value, options }) => {
            res.cookies.set({ name, value, ...options });
          });
        },
      },
    }
  );

  // Sign out on the server to clear cookies
  await supabase.auth.signOut();

  return res; // Cookies are cleared in the response
}
