// src/app/api/auth/session/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function POST(req: Request) {
  const url = new URL(req.url);
  const res = new NextResponse(null, { status: 204 });

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

  try {
    const { access_token, refresh_token } = await req.json();
    if (!access_token || !refresh_token) {
      return NextResponse.json({ error: "Missing tokens" }, { status: 400 });
    }
    await supabase.auth.setSession({ access_token, refresh_token });
    return res; // cookies set on response
  } catch (e) {
    return NextResponse.json({ error: "Bad payload" }, { status: 400 });
  }
}
