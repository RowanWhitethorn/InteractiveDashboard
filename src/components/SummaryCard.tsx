// src/components/SummaryCard.tsx
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface SummaryCardProps {
  title: string;
  value: number | string;
  suffix?: string;
  /** Optional small description or delta, e.g. "+5% from last week" */
  description?: string;
}

export default function SummaryCard({
  title,
  value,
  suffix = "",
  description,
}: SummaryCardProps) {
  return (
    <Card className="rounded-lg">
      <CardHeader className="pb-0">
        <CardTitle className="text-sm font-medium p-0">{title}</CardTitle>
      </CardHeader>

      <CardContent className="flex items-baseline justify-between pt-0">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-gray-900">{value}</span>
          {suffix && (
            <span className="text-lg font-normal text-muted-foreground">
              {suffix}
            </span>
          )}
        </div>
        {description && (
          <div className="text-xs text-muted-foreground">{description}</div>
        )}
      </CardContent>
    </Card>
  );
}
