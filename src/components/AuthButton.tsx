'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase/client';

export default function AuthButton() {
  const router = useRouter();
  const supabase = createSupabaseBrowser();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    // initial read
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    // live updates
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      setSignedIn(!!session);
      // force server components to refetch if you want the whole UI to reflect the change
      router.refresh();
    });
    return () => sub.subscription.unsubscribe();
  }, [router, supabase]);

  if (signedIn === null) {
    // tiny placeholder to avoid layout shift
    return <div className="w-[92px] h-[34px]" />;
  }

  return signedIn ? (
    <form action="/logout">
      <button className="rounded-md border px-3 py-1.5 text-sm">Sign out</button>
    </form>
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
