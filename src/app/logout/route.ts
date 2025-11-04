import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL('/sign-in', req.url));
}
