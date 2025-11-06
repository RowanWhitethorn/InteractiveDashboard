"use client";

import React, { useEffect, useMemo, useState, useTransition } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import SummaryCard from "./SummaryCard";
import DateRangePicker from "./DateRangePicker";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { motion } from "framer-motion";
import * as Metrics from "@/app/api/actions/metrics";
import type { MetricsResponse, MetricRow } from "@/app/api/actions/metrics";


const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
  hover: { scale: 1.03, boxShadow: "0px 8px 15px rgba(0,0,0,0.1)" },
};

// ---- Client-side data shape (normalized from API) ----
type DataPoint = {
  date: string; // ISO yyyy-mm-dd
  revenue: number;
  orders: number;
  sessions: number;
  newCustomers: number;
};

// 1) KPI metric configuration (same visual model, new data)
const metrics = [
  {
    key: "revenue" as const,
    title: "Total Revenue",
    accessor: (d: DataPoint) => d.revenue,
    colorToken: "--chart-1",
    suffix: "$",
  },
  {
    key: "orders" as const,
    title: "Total Orders",
    accessor: (d: DataPoint) => d.orders,
    colorToken: "--chart-2",
    suffix: "",
  },
  {
    key: "avgOrderValue" as const,
    title: "Avg. Order Value",
    accessor: (d: DataPoint) => (d.orders ? d.revenue / d.orders : 0),
    colorToken: "--chart-3",
    suffix: "$",
  },
  {
    key: "conversionRate" as const,
    title: "Conversion Rate",
    accessor: (d: DataPoint) => (d.sessions ? (d.orders / d.sessions) * 100 : 0),
    colorToken: "--chart-4",
    suffix: "%",
  },
  {
    key: "newCustomers" as const,
    title: "New Customers",
    accessor: (d: DataPoint) => d.newCustomers,
    colorToken: "--chart-5",
    suffix: "",
  },
] as const;
type MetricKey = (typeof metrics)[number]["key"];

// Companion metric mapping for bar chart
const compareWith: Record<MetricKey, MetricKey> = {
  revenue: "orders",
  orders: "newCustomers",
  avgOrderValue: "revenue",
  conversionRate: "orders",
  newCustomers: "orders",
};

export default function DashboardLayout({ role = "user" }: { role?: "admin" | "user" }) {
  const maxDays = role === "admin" ? 30 : 5;
  // 0) Initial window by role (normalize to midnight)
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0,0,0,0);
    return d;
  }, []);
  const start = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() - (maxDays - 1));
    return d;
  }, [today, maxDays]);
  const [range, setRange] = useState<[Date, Date]>([start, today]);
    // Reset range whenever role → maxDays changes so limits & labels stay in sync
  useEffect(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    const s = new Date(t);
    s.setDate(s.getDate() - (maxDays - 1));
    setRange([s, t]);
  }, [maxDays]);

  // 1) Remote data state
  const [data, setData] = useState<DataPoint[]>([]);
  const [totals, setTotals] = useState<{
    revenue: number;
    orders: number;
    sessions: number;
    new_customers: number;
    avg_order_value: number;
    conversion_rate: number; // 0..1
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // 2) Fetch when range changes
  useEffect(() => {
    const [from, to] = range;
    startTransition(async () => {
      setError(null);
      try {
            const run = async () => Metrics.range({ from, to });
        let res;
        try {
          res = await run();
        } catch (e: unknown) {
          // One-shot retry if just logged in and cookies haven't settled yet
          const msg = (e instanceof Error ? e.message : String(e)).toLowerCase();
          if (msg.includes('unauthorized')) {
            await new Promise(r => setTimeout(r, 350));
            res = await run();
          } else {
            throw e;
          }
        }
        const normalized: DataPoint[] = res.rows.map((r: MetricRow) => ({
          date: r.day, // el server action ya renombra metric_day → day
          revenue: r.revenue,
          orders: r.orders,
          sessions: r.sessions,
          newCustomers: r.new_customers,
        }));
        setData(normalized);
        setTotals(res.totals);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Failed to load metrics";
        console.error("metrics.range failed", e);
        setError(msg);
      }
    });
  }, [range]);

  // 3) Selected metric
  const [selected, setSelected] = useState<MetricKey>("revenue");
  const primary = metrics.find((m) => m.key === selected)!;
  const secondary = metrics.find((m) => m.key === compareWith[selected])!;

  // 4) Build series for charts
  const trendSeries = data.map((d) => ({
    date: d.date,
    value: primary.accessor(d),
  }));

  const compareSeries = data.map((d) => ({
    date: d.date,
    primary: primary.accessor(d),
    secondary: secondary.accessor(d),
  }));

  // 5) Totals for cards (use server totals; compute display-friendly values)
  const cardTotals: Record<MetricKey, number> = useMemo(() => {
    if (!totals) return { revenue: 0, orders: 0, avgOrderValue: 0, conversionRate: 0, newCustomers: 0 };
    return {
      revenue: totals.revenue,
      orders: totals.orders,
      avgOrderValue: totals.avg_order_value,
      conversionRate: totals.sessions > 0 ? totals.conversion_rate * 100 : 0, // server gives 0..1
      newCustomers: totals.new_customers,
    };
  }, [totals]);

  // 6) Chart configs
  const barConfig = {
    primary: { label: primary.title, color: `var(${primary.colorToken})` },
    secondary: { label: secondary.title, color: `var(${secondary.colorToken})` },
  } satisfies ChartConfig;

  const lineConfig = {
    value: { label: primary.title, color: `var(${primary.colorToken})` },
  } satisfies ChartConfig;

  // 7) UI states
  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-lg border bg-white p-6">
          <h2 className="text-lg font-semibold">Something went wrong</h2>
          <p className="mt-2 text-sm text-red-600">{error}</p>
          <button
            className="mt-4 rounded-md bg-gray-900 px-3 py-1.5 text-sm text-white"
            onClick={() => setRange([new Date(range[0]), new Date(range[1])])}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-4xl font-bold">Dashboard</h1>
                <DateRangePicker
          range={range}
          onChange={setRange}
          minNights={1}
          maxNights={maxDays}  // ← límite visual según rol
        />
      </div>

      {/* KPI grid */}
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 relative"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {metrics.map((m) => (
          <div key={m.key} className="relative">
            {selected === m.key && (
              <motion.div
                layoutId="kpiHighlight"
                className="absolute -inset-1 rounded-lg border-2 border-green-500 pointer-events-none"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}

            <motion.div
              layout
              onClick={() => setSelected(m.key)}
              className="relative z-10 cursor-pointer rounded-lg"
              whileHover={{ scale: 1.03, rotateX: 3, rotateY: 3 }}
              whileTap={{ scale: 0.97, rotateX: 0, rotateY: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <SummaryCard
                title={m.title}
                value={
                  pending || !totals
                    ? "…" // loading shimmer would be nicer, but you get the point
                    : m.suffix === "%"
                    ? cardTotals[m.key].toFixed(1)
                    : cardTotals[m.key].toFixed(0)
                }
                suffix={m.suffix}
              />
            </motion.div>
          </div>
        ))}
      </motion.div>

      {/* Charts */}
            <h2 className="text-2xl font-medium">
        {primary.title} Insights{" "}
        <span className="text-sm text-muted-foreground">
          {role === "admin" ? "(Up to 30 days)" : "(Up to 5 days)"}
        </span>
      </h2>

      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* — Line Chart Card — */}
        <motion.div variants={itemVariants} whileHover="hover">
          <Card>
            <CardHeader>
              <CardTitle>Trend (Line)</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ChartContainer config={lineConfig} className="h-full w-full">
                <LineChart data={trendSeries} margin={{ left: 12, right: 12 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={32}
                    tickFormatter={(v) =>
                      new Date(v).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                    }
                  />
                  <YAxis />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        nameKey="value"
                        labelFormatter={(v) =>
                          new Date(v).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        }
                      />
                    }
                  />
                  <Line dataKey="value" stroke={lineConfig.value.color} strokeWidth={2} dot={false} type="monotone" />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* — Bar Chart Card — */}
        <motion.div variants={itemVariants} whileHover="hover">
          <Card>
            <CardHeader>
              <CardTitle>
                {primary.title} vs {secondary.title} (Bar)
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ChartContainer config={barConfig} className="h-full w-full">
                <BarChart data={compareSeries} margin={{ left: 12, right: 12 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={32}
                    tickFormatter={(v) =>
                      new Date(v).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                    }
                  />
                  <YAxis />
                  <ChartLegend content={<ChartLegendContent />} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(v) =>
                          new Date(v).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        }
                      />
                    }
                  />
                  <Bar dataKey="primary" fill={barConfig.primary.color} stackId="a" />
                  <Bar dataKey="secondary" fill={barConfig.secondary.color} stackId="a" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Tiny loading hint */}
      {pending && <p className="text-sm text-muted-foreground">Loading fresh metrics…</p>}
    </div>
  );
}
