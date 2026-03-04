import { useDateRange } from "../../context/DateRangeContext";
import { useSuccessRate } from "../../hooks/useExecutiveSummary";
import { formatPercent } from "../../formatters";
import WidgetShell from "../../components/WidgetShell";

export default function SuccessRateKpiCard() {
  const { start, end } = useDateRange();
  const { data, isLoading, isError, refetch } = useSuccessRate(start, end);

  const deltaSign = data && data.delta_pp > 0 ? "+" : "";
  const deltaClass = data
    ? data.delta_pp > 0
      ? "up"
      : data.delta_pp < 0
        ? "down"
        : ""
    : "";

  return (
    <WidgetShell isLoading={isLoading} isError={isError} className="kpi" refetch={refetch}>
      <div className="kpi">
        <div className="kpi-label">Success Rate</div>
        <div className="kpi-value" style={{ color: "var(--green)" }}>
          {data && formatPercent(data.rate_pct)}
        </div>
        {data && (
          <div className={`kpi-delta ${deltaClass}`}>
            {deltaSign}{data.delta_pp.toFixed(1)}pp vs prior period
          </div>
        )}
      </div>
    </WidgetShell>
  );
}
