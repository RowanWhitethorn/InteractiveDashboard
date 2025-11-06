// src/middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PUBLIC_ONLY = new Set(["/sign-in", "/sign-up"]);

// ⚠️ No Supabase here.
// Use middleware only for trivial, non-auth things if you must.
export async function middleware(req: NextRequest) {
  // Example: do nothing, just pass-through
  return NextResponse.next();
}

export const config = {
  // Or empty matcher to effectively disable:
  // matcher: [],
  matcher: ["/_never-match"], // prevents running anywhere
};
