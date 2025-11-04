'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition, useMemo } from 'react';
import Link from 'next/link';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { Mail, Lock } from 'lucide-react';
import { InputField, PasswordInput } from '@/components/ui/input';

export default function SignUpPage() {
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user'); // ← new
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const res = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo:
              typeof window !== 'undefined' ? `${location.origin}/` : undefined,
          },
        });

        if (res.error) {
          console.error('signUp error', res.error);
          setError(res.error.message);
          return;
        }

        const session = res.data.session;
        const user = res.data.user;
        console.log('Session after sign-up:', session);

        // If email confirmations are OFF, user is already logged in.
        if (session && user) {
          // Upsert profile with chosen role (demo)
          const { error: upsertErr } = await supabase.from('profiles').upsert({
            user_id: user.id,
            email,
            role,
          });
          if (upsertErr) {
            console.warn('profiles upsert failed (will be created later on login):', upsertErr);
          }
          await supabase.auth.getSession();          
          await new Promise((r) => setTimeout(r, 50));
          router.refresh();                           
          router.replace('/');                        
        } else {
          // If confirmations are ON, user must verify email first.
          alert('Check your email to confirm your account, then sign in.');
          router.replace('/sign-in');
        }
      } catch (e: any) {
        console.error('signUp exception', e);
        setError(e?.message || 'Unexpected error');
      }
    });
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

        {/* Role selector (demo) */}
        <label className="block text-sm">
          Role <span className="text-[10px] text-amber-600 ml-1">do not try in RL</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'user' | 'admin')}
            className="mt-1 w-full border rounded-md px-3 py-2 bg-background"
          >
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>
        </label>

        {error &&
          !error.toLowerCase().includes('email') &&
          !error.toLowerCase().includes('password') && (
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
        Have an account?{' '}
        <Link href="/sign-in" className="underline">
          Sign in
        </Link>
      </div>
    </div>
  );
}
