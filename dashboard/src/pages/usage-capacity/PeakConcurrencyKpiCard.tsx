import { useDateRange } from "../../context/DateRangeContext";
import { useConcurrencyTimeseries } from "../../hooks/useUsageCapacity";
import { formatCount } from "../../formatters";
import { daysBetween } from "../../dateUtils";
import WidgetShell from "../../components/WidgetShell";

export default function PeakConcurrencyKpiCard() {
  const { start, end } = useDateRange();
  const { data, isLoading, isError, refetch } = useConcurrencyTimeseries(start, end);
  const exceeded = daysBetween(start, end) > 90;
  const days = daysBetween(start, end);

  return (
    <WidgetShell
      isLoading={!exceeded && isLoading}
      isError={!exceeded && isError}
      className="kpi"
      refetch={refetch}
    >
      <div className="kpi">
        <div className="kpi-label">Peak Concurrency ({days}d)</div>
        {exceeded ? (
          <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 8 }}>
            Concurrency data is limited to 90-day ranges.
          </div>
        ) : (
          <>
            <div className="kpi-value">
              {data && formatCount(data.peak_in_period)}
            </div>
            <div className="kpi-delta">
              {data &&
                (data.concurrency_limit != null
                  ? `Limit: ${data.concurrency_limit}`
                  : "No limit set")}
            </div>
          </>
        )}
      </div>
    </WidgetShell>
  );
}
