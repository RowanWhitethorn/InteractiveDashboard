"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/client";

type Role = "user" | "admin";
type InitialUser = { id: string; email: string | null } | null;

export default function UserBadge({
  initialUser,
  initialRole,
}: {
  initialUser: InitialUser;
  initialRole: Role;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowser(), []);

  // ✅ Seed from server truth so the header shows correctly on first paint
  const [email, setEmail] = useState<string | null>(initialUser?.email ?? null);
  const [role, setRole] = useState<Role | null>(initialUser ? initialRole : null);

  const loadProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setEmail(null);
      setRole(null);
      return;
    }
    setEmail(user.email ?? null);

    const { data: prof } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!prof) {
      await supabase
        .from("profiles")
        .insert({ user_id: user.id, email: user.email, role: "user" });
      setRole("user");
    } else {
      setRole((prof.role as Role) ?? "user");
    }
  }, [supabase]);

  useEffect(() => {
    // If server had no user (first mount after refresh), reconcile once
    if (!initialUser) {
      loadProfile();
    }

    const { data: sub } = supabase.auth.onAuthStateChange(async (evt, session) => {
      if (evt === "SIGNED_OUT" || !session) {
        setEmail(null);
        setRole(null);
        return;
      }
      if (evt === "INITIAL_SESSION" || evt === "SIGNED_IN" || evt === "TOKEN_REFRESHED" || evt === "USER_UPDATED") {
        await loadProfile();
      }
    });

    return () => sub.subscription.unsubscribe();
  }, [initialUser, loadProfile, supabase]);

  const username = useMemo(() => {
    if (!email) return "";
    const i = email.indexOf("@");
    return i >= 0 ? email.slice(0, i) : email;
  }, [email]);

  const handleChangeRole = async (next: Role) => {
    setRole(next); // snappy UI
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("profiles").update({ role: next }).eq("user_id", user.id);
    router.refresh(); // keep any server readers in sync
  };

  // If logged out, render nothing (keeps header clean)
  if (!email) return null;

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="px-2 py-1 rounded-md border bg-background">{username}</span>
      <label className="flex items-center gap-1">
        <span className="text-muted-foreground">Role</span>
        <select
          className="border rounded-md px-2 py-1 bg-background"
          value={role ?? "user"}
          onChange={(e) => handleChangeRole(e.target.value as Role)}
        >
          <option value="user">user</option>
          <option value="admin">admin</option>
        </select>
      </label>
      <span className="text-[10px] text-amber-600">do not try this in RL</span>
    </div>
  );
}
