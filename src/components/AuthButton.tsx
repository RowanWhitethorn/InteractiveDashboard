"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/client";

type InitialUser = { id: string; email: string | null } | null;

export default function AuthButton({ initialUser }: { initialUser: InitialUser }) {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const [signedIn, setSignedIn] = useState<boolean>(!!initialUser);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      setSignedIn(!!session);
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
  }, [router, supabase]);

  const handleSignOut = async () => {
    if (busy) return;
    setBusy(true);

    try {
      // 1) Optimistically clear client state (helps UI immediately)
      try { await supabase.auth.signOut(); } catch { /* ignore */ }

      // 2) Server-side signout clears httpOnly cookies
      await fetch("/api/auth/signout", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
      });

      // 3) Rehydrate server tree and leave
      router.refresh();
      router.replace("/sign-in");
    } finally {
      setBusy(false);
    }
  };

  return signedIn ? (
    <button
      onClick={handleSignOut}
      disabled={busy}
      className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-60"
    >
      {busy ? "Signing out…" : "Sign out"}
    </button>
  ) : (
    <div className="inline-flex items-center gap-2">
      <Link
        href="/sign-in"
        className="rounded-md bg-gray-900 px-3 py-1.5 text-sm text-white hover:bg-gray-800"
      >
        Sign in
      </Link>
      <span className="text-gray-300">/</span>
      <Link href="/sign-up" className="text-sm text-gray-700 hover:text-gray-900 underline">
        Sign up
      </Link>
    </div>
  );
}
