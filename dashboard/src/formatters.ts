/** Compact currency for KPI values and chart labels. */
export function formatCurrencyCompact(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

/** Full currency with thousands separator for table cells. */
export function formatCurrencyFull(value: number): string {
  return `$${Math.round(value).toLocaleString()}`;
}

/** Two-decimal currency for per-unit costs. */
export function formatCurrencyPrecise(value: number): string {
  return `$${value.toFixed(2)}`;
}

/** Percentage with one decimal place. */
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

/** Integer with thousands separator. */
export function formatCount(value: number): string {
  return Math.round(value).toLocaleString();
}

/** Signed percentage for delta display. */
export function formatSignedPercent(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

/** Duration in seconds with one decimal. */
export function formatDuration(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}

/** Relative timestamp for "last active" fields. */
export function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

/**
 * Maps a numeric delta to a semantic CSS class.
 * "up" = green (good), "down" = red (bad).
 * For cost metrics, positive = bad; for rate/count, positive = good.
 */
export function getDeltaClass(value: number, type: "cost" | "rate" | "count"): string {
  if (value === 0) return "";
  const isPositive = value > 0;
  const isGood = type === "cost" ? !isPositive : isPositive;
  return isGood ? "up" : "down";
}
