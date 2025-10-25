// src/components/AuthButton.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase/client';

export default function AuthButton() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowser(), []); // ← evita instancias por render
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    // lectura inicial
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    // suscripción a cambios (login/logout realizados en el cliente)
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      setSignedIn(!!session);
      router.refresh(); // refresca RSC
    });
    return () => sub.subscription.unsubscribe();
  }, [router, supabase]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();   // ← dispara onAuthStateChange en el cliente
    } catch {
      // opcional: log
    } finally {
      router.refresh();                // rehidrata componentes server
      router.push('/sign-in');         // UX: llévalo al sign-in
    }
  };

  if (signedIn === null) {
    return <div className="w-[92px] h-[34px]" />; // skeleton pequeño
  }

  return signedIn ? (
    // 👇 sin <form action="/logout">; lo hacemos client-side
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
