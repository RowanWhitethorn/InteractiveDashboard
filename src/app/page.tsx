import DashboardLayout from "@/components/DashboardLayout";
import { generateSalesData } from "@/lib/data";

export const revalidate = 300;

export default function DashboardPage() {
  const initialData = generateSalesData(30);
  return <DashboardLayout initialData={initialData} />;
}
