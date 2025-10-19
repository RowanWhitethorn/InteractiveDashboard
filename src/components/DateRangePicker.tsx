// src/components/DateRangePicker.tsx
"use client";

import * as React from "react";
import { format } from "date-fns";
import { type DateRange } from "react-day-picker";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import Calendar04 from "./calendar-04";

interface DateRangePickerProps {
  /** Controlled start/end dates */
  range: [Date, Date];
  /** Called when both from/to are selected */
  onChange: (range: [Date, Date]) => void;
  /** Optional nights constraints */
  minNights?: number;
  maxNights?: number;
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

  // When the user has picked both dates, propagate upstream and close
  React.useEffect(() => {
    if (selected?.from && selected?.to) {
      onChange([selected.from, selected.to]);
      setOpen(false);
    }
  }, [selected, onChange]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="  justify-between">
          {selected?.from
            ? format(selected.from, "MMM dd, yyyy")
            : "Start date"}{" "}
          – {selected?.to ? format(selected.to, "MMM dd, yyyy") : "End date"}
        </Button>
      </PopoverTrigger>

      <PopoverContent className=" p-0 bg-background w-fit" align="start">
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
