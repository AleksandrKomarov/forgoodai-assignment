import { useDateRange } from "../../context/DateRangeContext";
import { useRunVolume } from "../../hooks/useExecutiveSummary";
import { formatCount, formatSignedPercent, getDeltaClass } from "../../formatters";
import { daysBetween } from "../../dateUtils";
import WidgetShell from "../../components/WidgetShell";

export default function TotalRunsKpiCard() {
  const { start, end } = useDateRange();
  const { data, isLoading, isError, refetch } = useRunVolume(start, end);
  const days = daysBetween(start, end);

  return (
    <WidgetShell isLoading={isLoading} isError={isError} className="kpi" refetch={refetch}>
      <div className="kpi">
        <div className="kpi-label">Total Runs ({days}d)</div>
        <div className="kpi-value">{data && formatCount(data.total_runs)}</div>
        {data && (
          <div className={`kpi-delta ${getDeltaClass(data.delta_pct, "count")}`}>
            {formatSignedPercent(data.delta_pct)} vs prior period
          </div>
        )}
      </div>
    </WidgetShell>
  );
}
