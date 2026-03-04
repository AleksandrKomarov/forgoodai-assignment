import { useDateRange } from "../../context/DateRangeContext";
import { usePerfSuccessRate } from "../../hooks/usePerformance";
import { formatPercent } from "../../formatters";
import WidgetShell from "../../components/WidgetShell";

export default function SuccessRateKpiCard() {
  const { start, end } = useDateRange();
  const { data, isLoading, isError, refetch } = usePerfSuccessRate(start, end);

  const deltaClass = data
    ? data.delta_pp === 0
      ? ""
      : data.delta_pp > 0
        ? "up"
        : "down"
    : "";

  return (
    <WidgetShell
      isLoading={isLoading}
      isError={isError}
      className="kpi"
      refetch={refetch}
    >
      <div className="kpi">
        <div className="kpi-label">Success Rate</div>
        <div className="kpi-value" style={{ color: "var(--green)" }}>
          {data && formatPercent(data.rate_pct)}
        </div>
        <div className={`kpi-delta ${deltaClass}`}>
          {data && `${data.delta_pp > 0 ? "+" : ""}${data.delta_pp.toFixed(1)}pp`}
        </div>
      </div>
    </WidgetShell>
  );
}
