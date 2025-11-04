// src/lib/supabase/server.ts
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Cliente para Server Components (RSC): puede LEER cookies pero NO escribir.
 * Úsalo en layout/page y en helpers llamados desde RSC (getSession/getProfile).
 */
export async function createSupabaseServer() {
  const cookieStore = await cookies(); // Next 15: async
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      // En RSC NO se puede escribir cookies → no-op
      setAll(_cookiesToSet) {
        /* no-op en RSC */
      },
    },
  });
}

/**
 * Cliente para Server Actions o Route Handlers: puede LEER y ESCRIBIR cookies.
 * Úsalo SOLO dentro de acciones con "use server" o en handlers en /app/api.
 */
export async function createSupabaseServerAction() {
  const cookieStore = await cookies(); // en actions/handlers sí permite set()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set({ name, value, ...options });
        });
      },
    },
  });
}
