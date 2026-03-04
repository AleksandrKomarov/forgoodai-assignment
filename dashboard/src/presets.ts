import { type ComponentType } from "react";
import { toDateString, today, daysAgo } from "./dateUtils";
import CustomRangeInput from "./components/CustomRangeInput";

export interface PresetDefinition {
  key: string;
  label: string;
  computeRange?: () => { start: string; end: string };
  InputComponent?: ComponentType;
}

export const defaultPreset: PresetDefinition = {
  key: "30d",
  label: "Last 30 days",
  computeRange: () => ({ start: daysAgo(30), end: today() }),
};

export const presets: PresetDefinition[] = [
  {
    key: "7d",
    label: "Last 7 days",
    computeRange: () => ({ start: daysAgo(7), end: today() }),
  },
  defaultPreset,
  {
    key: "90d",
    label: "Last 90 days",
    computeRange: () => ({ start: daysAgo(90), end: today() }),
  },
  {
    key: "this-month",
    label: "This month",
    computeRange: () => {
      const now = new Date();
      const start = toDateString(new Date(now.getFullYear(), now.getMonth(), 1));
      return { start, end: today() };
    },
  },
  {
    key: "custom",
    label: "Custom range",
    InputComponent: CustomRangeInput,
  },
];
