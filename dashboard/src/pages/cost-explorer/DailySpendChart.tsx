import { useDateRange } from "../../context/DateRangeContext";
import { useDailySpend } from "../../hooks/useCostExplorer";
import { formatCurrencyCompact } from "../../formatters";
import WidgetShell from "../../components/WidgetShell";

const SERIES_COLORS = ["#4361ee", "#22c55e", "#f59e0b", "#ef4444", "#94a3b8", "#8b5cf6"];

interface Props {
  dimension: "team" | "agent_type";
  granularity: "daily" | "weekly" | "monthly";
}

function formatLabel(date: string, granularity: string): string {
  const d = new Date(date + "T00:00:00");
  if (granularity === "monthly") {
    return d.toLocaleDateString(undefined, { month: "short" });
  }
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function dimensionLabel(d: string): string {
  return d === "agent_type" ? "Agent Type" : "Team";
}

export default function DailySpendChart({ dimension, granularity }: Props) {
  const { start, end } = useDateRange();
  const { data, isLoading, isError, refetch } = useDailySpend(start, end, dimension, granularity);

  const series = data?.series ?? [];
  const bucketCount = series[0]?.data.length ?? 0;

  const maxTotal =
    bucketCount > 0
      ? Math.max(
          ...Array.from({ length: bucketCount }, (_, i) =>
            series.reduce((sum, s) => sum + (s.data[i]?.spend_usd ?? 0), 0),
          ),
        )
      : 1;

  return (
    <WidgetShell
      isLoading={isLoading}
      isError={isError}
      isEmpty={bucketCount === 0}
      className="card"
      refetch={refetch}
    >
      <div className="card">
        <div className="card-title">
          {capitalize(granularity)} Spend by {dimensionLabel(dimension)}
        </div>
        <div className="stacked-bar-chart" style={{ height: 200 }}>
          {Array.from({ length: bucketCount }, (_, i) => {
            const total = series.reduce((sum, s) => sum + (s.data[i]?.spend_usd ?? 0), 0);
            const date = series[0]?.data[i]?.date ?? "";
            return (
              <div className="stacked-bar-col" key={i}>
                <div
                  className="stacked-bar-stack"
                  style={{ height: `${(total / maxTotal) * 100}%` }}
                  title={formatCurrencyCompact(total)}
                >
                  {series.map((s, si) => {
                    const spend = s.data[i]?.spend_usd ?? 0;
                    if (spend === 0) return null;
                    return (
                      <div
                        key={s.key}
                        className="stacked-bar-segment"
                        style={{
                          height: `${(spend / total) * 100}%`,
                          background: SERIES_COLORS[si % SERIES_COLORS.length],
                        }}
                      />
                    );
                  })}
                </div>
                {i % 5 === 0 && (
                  <span className="stacked-bar-label">
                    {formatLabel(date, granularity)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <div className="chart-legend">
          {series.map((s, i) => (
            <span key={s.key}>
              <span
                className="legend-dot"
                style={{ background: SERIES_COLORS[i % SERIES_COLORS.length] }}
              />
              {s.label}
            </span>
          ))}
        </div>
      </div>
    </WidgetShell>
  );
}
