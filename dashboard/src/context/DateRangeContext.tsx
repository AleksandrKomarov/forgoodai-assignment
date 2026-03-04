import { createContext, useContext, useState, useMemo, type ReactNode } from "react";
import { presets, defaultPreset, type PresetDefinition } from "../presets";
import { today } from "../dateUtils";

export { presets, type PresetDefinition };

interface DateRange {
  start: string;
  end: string;
  activePreset: PresetDefinition;
  setPresetKey: (key: string) => void;
  setCustomRange: (start: string, end: string) => void;
}

const DateRangeContext = createContext<DateRange | null>(null);

export function DateRangeProvider({ children }: { children: ReactNode }) {
  const [presetKey, setPresetKey] = useState(defaultPreset.key);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const activePreset = presets.find((p) => p.key === presetKey) ?? defaultPreset;

  const range = useMemo(() => {
    if (activePreset.computeRange) {
      return activePreset.computeRange();
    }
    const fallback = today();
    return customStart && customEnd
      ? { start: customStart, end: customEnd }
      : { start: fallback, end: fallback };
  }, [activePreset, customStart, customEnd]);

  const setCustomRange = (start: string, end: string) => {
    setCustomStart(start);
    setCustomEnd(end);
    setPresetKey("custom");
  };

  return (
    <DateRangeContext.Provider value={{ ...range, activePreset, setPresetKey, setCustomRange }}>
      {children}
    </DateRangeContext.Provider>
  );
}

export function useDateRange(): DateRange {
  const ctx = useContext(DateRangeContext);
  if (!ctx) throw new Error("useDateRange must be used within DateRangeProvider");
  return ctx;
}
