'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Mail, Lock } from 'lucide-react';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { InputField, PasswordInput } from '@/components/ui/input';

export default function SignInPage() {
const supabase = createSupabaseBrowser();
const router = useRouter();
const search = useSearchParams();
const next = search.get('next') || '/';


const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [error, setError] = useState<string | null>(null);
const [pending] = useTransition();


async function onSubmit(e: React.FormEvent) {
  e.preventDefault();
  setError(null);
  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('signIn error', error);
      setError(error.message);
      return;
    }

     await supabase.auth.getSession();
     router.refresh();
     router.replace(next);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unexpected error';
    console.error('signIn exception', e);
    setError(msg);
  }
}


console.log("SB URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
return (
    <div className="mx-auto max-w-sm py-10">
      <h1 className="mb-6 text-2xl font-semibold">Sign in</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <InputField
          label="Email"
          type="email"
          required
          placeholder="you@example.com"
          left={<Mail className="h-4 w-4" />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={error?.toLowerCase().includes('email') ? error : false}
        />
        <PasswordInput
          placeholder="Your password"
          required
          left={<Lock className="h-4 w-4" />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={error?.toLowerCase().includes('password') ? error : false}
        />
        {error && !error.toLowerCase().includes('email') && !error.toLowerCase().includes('password') && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-gray-900 px-3 py-2 text-white hover:bg-gray-800 disabled:opacity-60"
        >
          {pending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
        <button
          className="underline"
          onClick={async () => {
            if (!email) { setError('Enter your email first.'); return; }
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
              redirectTo: typeof window !== 'undefined' ? `${location.origin}/sign-in` : undefined
            });
            if (error) setError(error.message); else alert('Password reset email sent.');
          }}
        >
          Forgot password?
        </button>
        <span>
          No account? <Link href="/sign-up" prefetch={false} className="underline">Sign up</Link>
        </span>
      </div>
    </div>
  );
}