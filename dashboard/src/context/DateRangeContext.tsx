import { createContext, useContext, useState, useMemo, type ReactNode } from "react";

type Preset = "7d" | "30d" | "90d" | "this-month";

interface DateRange {
  start: string;
  end: string;
  preset: Preset;
  setPreset: (preset: Preset) => void;
}

const DateRangeContext = createContext<DateRange | null>(null);

function computeRange(preset: Preset): { start: string; end: string } {
  const now = new Date();
  const end = now.toISOString().slice(0, 10);

  if (preset === "this-month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .slice(0, 10);
    return { start, end };
  }

  const days = preset === "7d" ? 7 : preset === "30d" ? 30 : 90;
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days);
  return { start: startDate.toISOString().slice(0, 10), end };
}

export function DateRangeProvider({ children }: { children: ReactNode }) {
  const [preset, setPreset] = useState<Preset>("30d");
  const range = useMemo(() => computeRange(preset), [preset]);

  return (
    <DateRangeContext.Provider value={{ ...range, preset, setPreset }}>
      {children}
    </DateRangeContext.Provider>
  );
}

export function useDateRange(): DateRange {
  const ctx = useContext(DateRangeContext);
  if (!ctx) throw new Error("useDateRange must be used within DateRangeProvider");
  return ctx;
}

export const presetLabels: Record<Preset, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  "this-month": "This month",
};
