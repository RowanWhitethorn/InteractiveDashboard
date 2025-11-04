// src/components/UserBadge.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/client";

type Role = "user" | "admin";

export default function UserBadge() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowser(), []);

  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setEmail(null);
      setRole(null);
      setLoading(false);
      return;
    }

    const emailLocal = user.email ?? "";
    const { data: prof } = await supabase
      .from("profiles")
      .select("user_id, email, role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!prof) {
      // Seed mínimo (demo)
      await supabase.from("profiles").insert({
        user_id: user.id,
        email: user.email,
        role: "user",
      });
      setRole("user");
    } else {
      setRole((prof.role as Role) ?? "user");
    }

    setEmail(emailLocal);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    let alive = true;

    // Carga inicial
    (async () => {
      setLoading(true);
      await loadProfile();
    })();

    // Suscripción a cambios de sesión
    const { data: sub } = supabase.auth.onAuthStateChange(async (evt, session) => {
      if (!alive) return;

      // Logout o sesión nula → limpiar inmediatamente
      if (evt === "SIGNED_OUT" || !session) {
        setEmail(null);
        setRole(null);
        setLoading(false);
        return;
      }

      // Login / refresh / updates → recargar perfil
      if (evt === "SIGNED_IN" || evt === "TOKEN_REFRESHED" || evt === "USER_UPDATED") {
        setLoading(true);
        await loadProfile();
        // No navegamos aquí; AuthButton ya hace push/refresh cuando corresponde.
      }
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase, loadProfile]);

  const username = useMemo(() => {
    if (!email) return "";
    const i = email.indexOf("@");
    return i >= 0 ? email.slice(0, i) : email;
  }, [email]);

  const handleChangeRole = async (next: Role) => {
    setRole(next); // UI snappy
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("profiles").update({ role: next }).eq("user_id", user.id);
    router.refresh(); // Para que cualquier Server Component que lea el perfil se actualice
  };

  if (loading) return <div className="text-sm text-muted-foreground">…</div>;
  if (!email) return null;

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="px-2 py-1 rounded-md border bg-background">{username}</span>
      <label className="flex items-center gap-1">
        <span className="text-muted-foreground">Role</span>
        <select
          className="border rounded-md px-2 py-1 bg-background"
          value={role ?? "user"}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            handleChangeRole(e.target.value as Role)
          }
        >
          <option value="user">user</option>
          <option value="admin">admin</option>
        </select>
      </label>
      <span className="text-[10px] text-amber-600">do not try this in RL</span>
    </div>
  );
}
