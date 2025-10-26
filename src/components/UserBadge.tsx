// src/components/UserBadge.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/client";

type Role = "user" | "admin";

export default function UserBadge() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  // Cargar sesión + perfil; crear perfil si falta (demo-mode)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) { setEmail(null); setRole(null); setLoading(false); }
        return;
      }
      const emailLocal = user.email ?? "";
      const { data: prof } = await supabase
        .from("profiles")
        .select("user_id, email, role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!prof) {
        // seed mínimo para demo si no existe perfil
        await supabase.from("profiles").insert({
          user_id: user.id,
          email: user.email,
          role: "user",
        });
        if (!cancelled) setRole("user");
      } else {
        if (!cancelled) setRole((prof.role as Role) ?? "user");
      }
      if (!cancelled) setEmail(emailLocal);
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [supabase]);

  const username = useMemo(() => {
    if (!email) return "";
    const i = email.indexOf("@");
    return i >= 0 ? email.slice(0, i) : email;
  }, [email]);

  const handleChangeRole = async (next: Role) => {
    setRole(next); // UI snappy
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("profiles")
      .update({ role: next })
      .eq("user_id", user.id);
    // refresca server components (page.tsx volverá a leer getProfile)
    router.refresh();
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
          onChange={(e) => handleChangeRole(e.target.value as Role)}
        >
          <option value="user">user</option>
          <option value="admin">admin</option>
        </select>
      </label>
      <span className="text-[10px] text-amber-600">no intentar en producción ☺</span>
    </div>
  );
}
