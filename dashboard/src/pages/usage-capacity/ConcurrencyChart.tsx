import { useDateRange } from "../../context/DateRangeContext";
import { useConcurrencyTimeseries } from "../../hooks/useUsageCapacity";
import { daysBetween } from "../../dateUtils";
import WidgetShell from "../../components/WidgetShell";

function formatLabel(date: string): string {
  const d = new Date(date + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function barColor(peak: number, limit: number | null): string {
  if (limit == null) return "var(--accent)";
  if (peak >= limit) return "var(--red)";
  if (peak >= limit * 0.9) return "var(--orange)";
  return "var(--accent)";
}

export default function ConcurrencyChart() {
  const { start, end } = useDateRange();
  const { data, isLoading, isError, refetch } = useConcurrencyTimeseries(start, end);
  const exceeded = daysBetween(start, end) > 90;

  const daily = data?.daily ?? [];
  const maxPeak = daily.length > 0 ? Math.max(...daily.map((d) => d.peak_concurrent)) : 1;
  const chartMax = data?.concurrency_limit ? Math.max(maxPeak, data.concurrency_limit) : maxPeak;

  return (
    <WidgetShell
      isLoading={!exceeded && isLoading}
      isError={!exceeded && isError}
      isEmpty={!exceeded && daily.length === 0}
      className="card"
      refetch={refetch}
    >
      <div className="card">
        <div className="card-title">Concurrency Over Time</div>
        {exceeded ? (
          <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 8 }}>
            Concurrency data is limited to 90-day ranges.
          </div>
        ) : (
          <>
            <div className="concurrency-chart" style={{ height: 200 }}>
              {data?.concurrency_limit != null && (
                <div
                  className="concurrency-limit-line"
                  style={{
                    bottom: `${(data.concurrency_limit / chartMax) * 100}%`,
                  }}
                  title={`Limit: ${data.concurrency_limit}`}
                >
                  <span className="concurrency-limit-label">
                    Limit: {data.concurrency_limit}
                  </span>
                </div>
              )}
              {daily.map((d, i) => (
                <div
                  className="concurrency-bar"
                  key={d.date}
                  style={{
                    height: `${(d.peak_concurrent / chartMax) * 100}%`,
                    background: barColor(d.peak_concurrent, data?.concurrency_limit ?? null),
                  }}
                  title={`${d.date}: ${d.peak_concurrent}`}
                >
                  {i % 5 === 0 && (
                    <span className="concurrency-label">{formatLabel(d.date)}</span>
                  )}
                </div>
              ))}
            </div>
            <div className="chart-legend">
              <span>
                <span className="legend-dot" style={{ background: "var(--accent)" }} />
                Normal
              </span>
              {data?.concurrency_limit != null && (
                <>
                  <span>
                    <span className="legend-dot" style={{ background: "var(--orange)" }} />
                    Near limit
                  </span>
                  <span>
                    <span className="legend-dot" style={{ background: "var(--red)" }} />
                    At/over limit
                  </span>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </WidgetShell>
  );
}
