import { subDays, startOfDay } from "date-fns";

export type SalesPoint = {
  date: string; // day ISO string, e.g. "2025-07-18"
  revenue: number; // total revenue that day
  orders: number; // total orders that day
  sessions: number; // total sessions that day (for conversion rate)
  newCustomers: number; // count of first‑time buyers
};

export function generateSalesData(days = 30): SalesPoint[] {
  const today = startOfDay(new Date());
  const result: SalesPoint[] = [];

  for (let i = days; i >= 0; i--) {
    const day = subDays(today, i);

    // Simulate daily totals
    const orders = Math.floor(50 + Math.random() * 150);
    const avgOrder = 20 + Math.random() * 180; // $20–$200
    const revenue = orders * avgOrder;
    const sessions = Math.floor(orders * (1 + Math.random() * 2)); // 1–3× orders
    const newCustomers = Math.floor(orders * (0.2 + Math.random() * 0.5)); // 20–70%

    result.push({
      date: day.toISOString(),
      orders,
      revenue,
      sessions,
      newCustomers,
    });
  }

  return result;
}
