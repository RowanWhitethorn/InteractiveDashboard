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

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      setSignedIn(!!session);
      // ✅ Refresh server tree on all relevant auth events (including initial)
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
    await supabase.auth.signOut();
    router.refresh();
    router.replace("/sign-in");
  };

  return signedIn ? (
    <button
      onClick={handleSignOut}
      className="rounded-md border px-3 py-1.5 text-sm"
    >
      Sign out
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
