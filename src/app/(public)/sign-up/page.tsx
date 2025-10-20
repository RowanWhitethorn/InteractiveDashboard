'use client';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import Link from 'next/link';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { Mail, Lock } from 'lucide-react';
import { InputField, PasswordInput } from '@/components/ui/input';


export default function SignUpPage() {
const supabase = createSupabaseBrowser();
const router = useRouter();


const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [error, setError] = useState<string | null>(null);
const [pending, startTransition] = useTransition();


async function onSubmit(e: React.FormEvent) {
  e.preventDefault();
  setError(null);
  try {
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: typeof window !== 'undefined' ? `${location.origin}/app` : undefined },
    });
    if (error) { console.error('signUp error', error); setError(error.message); return; }
    const { data } = await supabase.auth.getSession();
    console.log('Session after sign-up', data.session);
    router.replace('/app');
  } catch (e: any) {
    console.error('signUp exception', e);
    setError(e?.message || 'Unexpected error');
  }
}



 return (
    <div className="mx-auto max-w-sm py-10">
      <h1 className="mb-6 text-2xl font-semibold">Create account</h1>
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
          placeholder="Choose a password"
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
          {pending ? 'Creating account…' : 'Sign up'}
        </button>
      </form>
      <div className="mt-4 text-sm text-gray-600">
        Have an account? <Link href="/sign-in" className="underline">Sign in</Link>
      </div>
    </div>
  );
}