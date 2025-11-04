// src/components/SessionSync.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/client";

export default function SessionSync() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createSupabaseBrowser();

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      // INITIAL_SESSION fires immediately with current session
      // Also refresh on SIGNED_IN / TOKEN_REFRESHED / USER_UPDATED / SIGNED_OUT
      if (
        event === "INITIAL_SESSION" ||
        event === "SIGNED_IN" ||
        event === "TOKEN_REFRESHED" ||
        event === "USER_UPDATED" ||
        event === "SIGNED_OUT"
      ) {
        router.refresh();
      }
    });

    return () => sub.subscription.unsubscribe();
  }, [router]);

  return null;
}

