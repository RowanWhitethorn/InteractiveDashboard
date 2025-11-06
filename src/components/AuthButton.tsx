"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/client";

type InitialUser = { id: string; email: string | null } | null;

export default function AuthButton({ initialUser }: { initialUser?: InitialUser }) {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (!alive) return;
        setSignedIn(!!data.user);
      } catch {
        if (!alive) return;
        setSignedIn(!!initialUser);
      }
    })();
    const { data: sub } = supabase.auth.onAuthStateChange(async (event) => {
      // For safety, confirm with getUser() on events that can change server UI.
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        const { data } = await supabase.auth.getUser();
        setSignedIn(!!data.user);
        router.refresh();
      }
      // Avoid refreshing on INITIAL_SESSION / TOKEN_REFRESHED to prevent loops.
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [router, supabase, initialUser]);

  const handleSignOut = async () => {
    if (busy) return;
    setBusy(true);

    try {

      try { await supabase.auth.signOut(); } catch { /* ignore */ }

      // 2) Server-side signout clears httpOnly cookies
      await fetch("/api/auth/signout", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
         cache: "no-store",
      });


      // 3) Rehydrate server tree and leave
      router.refresh();
      router.replace("/sign-in");
    } finally {
      setBusy(false);
    }
  };
  if (signedIn === null) {
    return <div className="w-[92px] h-[34px]" />;
  }
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
