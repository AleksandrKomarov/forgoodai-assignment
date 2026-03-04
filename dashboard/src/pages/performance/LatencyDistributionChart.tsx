import { useDateRange } from "../../context/DateRangeContext";
import { useLatencyDistribution } from "../../hooks/usePerformance";
import WidgetShell from "../../components/WidgetShell";

function formatLabel(date: string): string {
  const d = new Date(date + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function LatencyDistributionChart() {
  const { start, end } = useDateRange();
  const { data, isLoading, isError, refetch } = useLatencyDistribution(start, end);

  const daily = data?.daily ?? [];

  const maxLatency =
    daily.length > 0
      ? Math.max(...daily.map((d) => d.p99_ms))
      : 1;

  return (
    <WidgetShell
      isLoading={isLoading}
      isError={isError}
      isEmpty={daily.length === 0}
      className="card"
      refetch={refetch}
    >
      <div className="card">
        <div className="card-title">Latency Distribution (p50 / p95 / p99)</div>
        <div className="latency-chart" style={{ height: 200 }}>
          {daily.map((d, i) => (
            <div
              className="latency-bar-col"
              key={d.date}
              style={{ height: "100%" }}
              title={`${d.date}\np50: ${d.p50_ms}ms\np95: ${d.p95_ms}ms\np99: ${d.p99_ms}ms`}
            >
              <div
                className="bar-p99"
                style={{ height: `${(d.p99_ms / maxLatency) * 100}%` }}
              />
              <div
                className="bar-p95"
                style={{ height: `${(d.p95_ms / maxLatency) * 100}%` }}
              />
              <div
                className="bar-p50"
                style={{ height: `${(d.p50_ms / maxLatency) * 100}%` }}
              />
              {i % 5 === 0 && (
                <span className="latency-bar-label">
                  {formatLabel(d.date)}
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="chart-legend">
          <span>
            <span className="legend-dot" style={{ background: "#4361ee" }} />
            p50
          </span>
          <span>
            <span className="legend-dot" style={{ background: "rgba(67,97,238,0.45)" }} />
            p95
          </span>
          <span>
            <span className="legend-dot" style={{ background: "rgba(67,97,238,0.18)" }} />
            p99
          </span>
        </div>
      </div>
    </WidgetShell>
  );
}
