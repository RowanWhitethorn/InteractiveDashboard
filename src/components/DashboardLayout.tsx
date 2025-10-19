"use client";

import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

import { SalesPoint } from "@/lib/data";
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
  hover: { scale: 1.03, boxShadow: "0px 8px 15px rgba(0,0,0,0.1)" },
};

/* 1. KPI metric configuration  */
const metrics = [
  {
    key: "revenue" as const,
    title: "Total Revenue",
    accessor: (d: SalesPoint) => d.revenue,
    colorToken: "--chart-1",
    suffix: "$",
  },
  {
    key: "orders" as const,
    title: "Total Orders",
    accessor: (d: SalesPoint) => d.orders,
    colorToken: "--chart-2",
    suffix: "",
  },
  {
    key: "avgOrderValue" as const,
    title: "Avg. Order Value",
    accessor: (d: SalesPoint) => (d.orders ? d.revenue / d.orders : 0),
    colorToken: "--chart-3",
    suffix: "$",
  },
  {
    key: "conversionRate" as const,
    title: "Conversion Rate",
    accessor: (d: SalesPoint) =>
      d.sessions ? (d.orders / d.sessions) * 100 : 0,
    colorToken: "--chart-4",
    suffix: "%",
  },
  {
    key: "newCustomers" as const,
    title: "New Customers",
    accessor: (d: SalesPoint) => d.newCustomers,
    colorToken: "--chart-5",
    suffix: "",
  },
] as const;
type MetricKey = (typeof metrics)[number]["key"];

/* Companion-metric mapping for bar chart comparisons */
const compareWith: Record<MetricKey, MetricKey> = {
  revenue: "orders",
  orders: "newCustomers",
  avgOrderValue: "revenue",
  conversionRate: "orders",
  newCustomers: "orders",
};

export default function DashboardLayout({
  initialData,
}: {
  initialData: SalesPoint[];
}) {
  /*   State: data & date filter   */
  const [data] = useState(initialData);
  const [filtered, setFiltered] = useState(initialData);
  const [range, setRange] = useState<[Date, Date]>([
    new Date(initialData[0].date),
    new Date(initialData[initialData.length - 1].date),
  ]);

  useEffect(() => {
    const [start, end] = range;
    setFiltered(
      data.filter((d) => {
        const day = new Date(d.date);
        return day >= start && day <= end;
      })
    );
  }, [data, range]);

  /*  KPI totals  */
  const totals = metrics.reduce((acc, m) => {
    acc[m.key] = filtered.reduce((s, d) => s + m.accessor(d), 0);
    return acc;
  }, {} as Record<MetricKey, number>);

  /*   Selected metric key  */
  const [selected, setSelected] = useState<MetricKey>("revenue");
  const primary = metrics.find((m) => m.key === selected)!;
  const secondary = metrics.find((m) => m.key === compareWith[selected])!;

  /*   Series for charts   */
  const trendSeries = filtered.map((d) => ({
    date: d.date,
    value: primary.accessor(d),
  }));
  const compareSeries = filtered.map((d) => ({
    date: d.date,
    primary: primary.accessor(d),
    secondary: secondary.accessor(d),
  }));

  /* ChartConfig with both series for bar chart */
  const barConfig = {
    primary: { label: primary.title, color: `var(${primary.colorToken})` },
    secondary: {
      label: secondary.title,
      color: `var(${secondary.colorToken})`,
    },
  } satisfies ChartConfig;

  const lineConfig = {
    value: { label: primary.title, color: `var(${primary.colorToken})` },
  } satisfies ChartConfig;

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-4xl font-bold">Dashboard</h1>
        <DateRangePicker
          range={range}
          onChange={setRange}
          minNights={1}
          maxNights={365}
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
            {/* 1️⃣ Moving highlight */}
            {selected === m.key && (
              <motion.div
                layoutId="kpiHighlight"
                className="absolute -inset-1  rounded-lg border-2  border-green-500 pointer-events-none"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}

            {/* 2️⃣ The actual card */}
            <motion.div
              layout
              onClick={() => setSelected(m.key)}
              className="relative z-10 cursor-pointer rounded-lg  "
              whileHover={{
                scale: 1.03,
                rotateX: 3,
                rotateY: 3,
              }}
              whileTap={{ scale: 0.97, rotateX: 0, rotateY: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <SummaryCard
                title={m.title}
                value={totals[m.key].toFixed(m.suffix === "%" ? 1 : 0)}
                suffix={m.suffix}
              />
            </motion.div>
          </div>
        ))}
      </motion.div>

      {/* Charts */}
      <h2 className="text-2xl font-medium">{primary.title} Insights</h2>

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
                      new Date(v).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })
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
                  <Line
                    dataKey="value"
                    stroke={lineConfig.value.color}
                    strokeWidth={2}
                    dot={false}
                    type="monotone"
                  />
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
                      new Date(v).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })
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
                  <Bar
                    dataKey="primary"
                    fill={barConfig.primary.color}
                    stackId="a"
                  />
                  <Bar
                    dataKey="secondary"
                    fill={barConfig.secondary.color}
                    stackId="a"
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
