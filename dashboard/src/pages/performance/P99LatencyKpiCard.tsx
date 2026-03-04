import { useDateRange } from "../../context/DateRangeContext";
import { useLatencyKpi } from "../../hooks/usePerformance";
import { formatDuration, formatLatencyDelta, getLatencyDeltaClass } from "../../formatters";
import { daysBetween } from "../../dateUtils";
import WidgetShell from "../../components/WidgetShell";

export default function P99LatencyKpiCard() {
  const { start, end } = useDateRange();
  const { data, isLoading, isError, refetch } = useLatencyKpi(start, end);
  const exceeded = daysBetween(start, end) > 90;

  return (
    <WidgetShell
      isLoading={!exceeded && isLoading}
      isError={!exceeded && isError}
      className="kpi"
      refetch={refetch}
    >
      <div className="kpi">
        <div className="kpi-label">P99 Latency</div>
        {exceeded ? (
          <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 8 }}>
            Latency data is limited to 90-day ranges.
          </div>
        ) : (
          <>
            <div className="kpi-value">
              {data && formatDuration(data.p99_ms)}
            </div>
            <div className={`kpi-delta ${data ? getLatencyDeltaClass(data.delta_p99_ms) : ""}`}>
              {data && formatLatencyDelta(data.delta_p99_ms)}
            </div>
          </>
        )}
      </div>
    </WidgetShell>
  );
}
