// src/app/page.tsx
import DashboardLayout from "@/components/DashboardLayout";
import { getSession, getProfile } from "@/lib/auth";

export const revalidate = 300;

export default async function DashboardPage() {
  const session = await getSession();
  const profile = session ? await getProfile() : null;
  const role: "admin" | "user" = profile?.role === "admin" ? "admin" : "user";
  return <DashboardLayout role={role} />;
}
