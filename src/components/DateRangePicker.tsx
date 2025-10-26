// src/components/DateRangePicker.tsx
"use client";

import * as React from "react";
import { format } from "date-fns";
import { type DateRange } from "react-day-picker";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import Calendar04 from "./calendar-04";

interface DateRangePickerProps {
  range: [Date, Date];
  onChange: (range: [Date, Date]) => void;
  minNights?: number;
  maxNights?: number;
}

function atMidnight(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function daysInclusive(a: Date, b: Date) {
  const A = atMidnight(a);
  const B = atMidnight(b);
  return Math.floor((B.getTime() - A.getTime()) / 86400000) + 1;
}

export default function DateRangePicker({
  range,
  onChange,
  minNights,
  maxNights,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<DateRange | undefined>({
    from: range[0],
    to: range[1],
  });

  // Mantener el estado local sincronizado con el rango controlado del padre
  React.useEffect(() => {
    setSelected({ from: range[0], to: range[1] });
  }, [range]);

  // Solo propagar cambios cuando realmente cambian (evita bucle)
  React.useEffect(() => {
    if (selected?.from && selected?.to) {
      const from = atMidnight(selected.from);
      const to = atMidnight(selected.to);

      const currentFrom = atMidnight(range[0]);
      const currentTo = atMidnight(range[1]);

      // Clamp visual
      const count = daysInclusive(from, to);
      const min = Math.max(1, minNights ?? 1);
      const max = Math.max(min, maxNights ?? count);

      let nextFrom = from;
      let nextTo = to;

      if (count < min) {
        nextFrom = new Date(to);
        nextFrom.setDate(to.getDate() - (min - 1));
      }
      if (daysInclusive(nextFrom, nextTo) > max) {
        nextFrom = new Date(nextTo);
        nextFrom.setDate(nextTo.getDate() - (max - 1));
      }

      // ⛔️ IMPORTANTE: no llames onChange si no hay diferencia real
      const changed =
        nextFrom.getTime() !== currentFrom.getTime() ||
        nextTo.getTime() !== currentTo.getTime();

      if (changed) {
        onChange([nextFrom, nextTo]);
      }
      setOpen(false);
    }
  }, [selected, onChange, minNights, maxNights, range]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="justify-between">
          {selected?.from ? format(selected.from, "MMM dd, yyyy") : "Start date"}{" "}
          – {selected?.to ? format(selected.to, "MMM dd, yyyy") : "End date"}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="p-0 bg-background w-fit" align="start">
        <Calendar04
          selected={selected}
          onSelect={setSelected}
          min={minNights}
          max={maxNights}
        />
      </PopoverContent>
    </Popover>
  );
}
