'use server';

import { z } from 'zod';
import { createSupabaseServerAction } from '@/lib/supabase/server';

export type MetricRow = {
  day: string;
  revenue: number;
  orders: number;
  sessions: number;
  new_customers: number;
};

export type MetricsResponse = {
  rows: MetricRow[];
  totals: {
    revenue: number;
    orders: number;
    sessions: number;
    new_customers: number;
    avg_order_value: number;
    conversion_rate: number; // 0..1
  };
};

type RpcRow = {
  metric_day: string;
  revenue: number;
  orders: number;
  sessions: number;
  new_customers: number;
};

const RangeInput = z.object({
  from: z.coerce.date(),
  to: z.coerce.date(),
  userId: z.string().uuid().optional(),
});

function iso(d: Date) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export async function range(input: unknown) {
  const supabase = await createSupabaseServerAction();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // return empty shape instead of throwing
    return {
      rows: [],
      totals: {
        revenue: 0, orders: 0, sessions: 0, new_customers: 0,
        avg_order_value: 0, conversion_rate: 0,
      },
    };
  }

  const { data: prof } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  const isAdmin = prof?.role === 'admin';

  const parsed = RangeInput.parse(input);
  // Normaliza orden
  let from = parsed.from <= parsed.to ? parsed.from : parsed.to;
  const to   = parsed.to   >= parsed.from ? parsed.to   : parsed.from;

  //  Cap de rango: admin 30 días, user 5 días
  const maxDays = isAdmin ? 30 : 5;
  const msPerDay = 24 * 3600 * 1000;
  const diff = Math.floor((to.getTime() - from.getTime()) / msPerDay) + 1;
  if (diff > maxDays) {
    // recorta por el inicio para mantener el "to" seleccionado
    from = new Date(to.getTime() - (maxDays - 1) * msPerDay);
  }

  const owner = isAdmin && parsed.userId ? parsed.userId : user.id;

  // 1) Llama a la RPC para asegurar datos y devolver el rango
  const { data: rows, error: rpcErr } = await supabase
    .rpc('ensure_metrics', {
      p_owner: owner,
      p_start: iso(from),
      p_end: iso(to),
    });

  if (rpcErr) throw rpcErr;

  // 2) Totales
  let revenue = 0, orders = 0, sessions = 0, new_customers = 0;
  for (const r of rows ?? []) {
    revenue += Number(r.revenue) || 0;
    orders  += Number(r.orders) || 0;
    sessions += Number(r.sessions) || 0;
    new_customers += Number(r.new_customers) || 0;
  }

  const avg_order_value = orders > 0 ? revenue / orders : 0;
  const conversion_rate = sessions > 0 ? orders / sessions : 0;

  return {
 rows: (rows ?? []).map((r: RpcRow) => ({
   day: r.metric_day,  
      revenue: Number(r.revenue) || 0,
      orders: Number(r.orders) || 0,
      sessions: Number(r.sessions) || 0,
      new_customers: Number(r.new_customers) || 0,
    })),
    totals: { revenue, orders, sessions, new_customers, avg_order_value, conversion_rate },
  };
}
