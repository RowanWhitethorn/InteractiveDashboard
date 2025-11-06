import { redirect } from "next/navigation";
import type { Session, User } from "@supabase/supabase-js";
import { createSupabaseServer } from "@/lib/supabase/server";

// Keep the profile shape narrow and stable
export type Profile = {
  user_id: string;
  email: string | null;
  role: "user" | "admin";
  display_name: string | null;
};

/** Get a server-side Supabase client wired to Next 15 cookies API */
export async function getSupabase() {
  return await createSupabaseServer();
}

/** Read the current session (null if anonymous). */
export async function getSession(): Promise<Session | null> {
  const supabase = await getSupabase();
  const { data: { session } } = await supabase.auth.getSession();
  return session ?? null;
}

/** Enforce an authenticated session or redirect to /sign-in. */
export async function requireUser() {
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");
  return { supabase, user };
}

/** Convenience: get the current user object (null if not signed in). */
export async function getUser(): Promise<User | null> {
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  return user ?? null;
}

/** Fetch the caller's profile row (null if none or not signed in). */
export async function getProfile(): Promise<Profile | null> {
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, email, role, display_name")
    .eq("user_id", user.id)
    .maybeSingle();
 if (error) {
   // Devuelve null, no rompas el layout. Loguea si quieres.
   console.warn("getProfile() suppressed error:", error.message);
   return null;
 }
 return (data as Profile) ?? null;
}

/** Enforce admin role or redirect away. */
export async function requireAdmin() {
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (data?.role !== "admin") redirect("/");

  return { supabase, user };
}
