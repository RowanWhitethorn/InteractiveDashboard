// src/app/page.tsx
import DashboardLayout from "@/components/DashboardLayout";
import { getProfile, requireUser } from "@/lib/auth";

 export const dynamic = 'force-dynamic';
 export const revalidate = 0;            // extra safety
 export const fetchCache = 'force-no-store'; // belt & suspenders

export default async function DashboardPage() {
  await requireUser();             // still enforces auth
  const profile = await getProfile();
  const role: "admin" | "user" = profile?.role === "admin" ? "admin" : "user";
  return <DashboardLayout role={role} key={role} />; // keep key={role}
}
