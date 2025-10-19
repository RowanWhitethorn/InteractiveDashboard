import * as React from "react";
import { type DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";

export interface Calendar04Props {
  /** current selection */ selected?: DateRange;
  /** fires when the user picks a new from/to */
  onSelect: (range: DateRange | undefined) => void;
  /** min nights (optional) */
  min?: number;
  /** max nights (optional) */
  max?: number;
  /** how many months to show side‑by‑side */
  numberOfMonths?: number;
}

/**
 * Controlled wrapper around your shadcn/ui `Calendar`.
 */
export default function Calendar04({
  selected,
  onSelect,
  min,
  max,
  numberOfMonths = 1,
}: Calendar04Props) {
  return (
    <Calendar
      mode="range"
      defaultMonth={selected?.from}
      selected={selected}
      onSelect={onSelect}
      numberOfMonths={numberOfMonths}
      min={min}
      max={max}
      className="rounded-lg border shadow-sm"
    />
  );
}
