import { useDateRange } from "../../context/DateRangeContext";
import { useSpendKpi } from "../../hooks/useExecutiveSummary";
import { formatCurrencyCompact, formatSignedPercent, getDeltaClass } from "../../formatters";
import { daysBetween } from "../../dateUtils";
import WidgetShell from "../../components/WidgetShell";

export default function SpendKpiCard() {
  const { start, end } = useDateRange();
  const { data, isLoading, isError, refetch } = useSpendKpi(start, end);
  const days = daysBetween(start, end);

  return (
    <WidgetShell isLoading={isLoading} isError={isError} className="kpi" refetch={refetch}>
      <div className="kpi">
        <div className="kpi-label">Accumulated Spend ({days}d)</div>
        <div className="kpi-value">{data && formatCurrencyCompact(data.spend_usd)}</div>
        {data && (
          <div className={`kpi-delta ${getDeltaClass(data.delta_pct, "cost")}`}>
            {formatSignedPercent(data.delta_pct)} vs prior period
          </div>
        )}
      </div>
    </WidgetShell>
  );
}
