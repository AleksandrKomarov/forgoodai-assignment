import { useBudgetForecast } from "../../hooks/useExecutiveSummary";
import { formatCurrencyCompact } from "../../formatters";
import WidgetShell from "../../components/WidgetShell";

export default function ProjectedSpendCard() {
  const { data, isLoading, isError, refetch } = useBudgetForecast();

  let deltaText: string | null = null;
  let deltaClass = "";

  if (data) {
    const over = data.forecast.projected_over_budget_usd;
    if (over !== null) {
      if (over > 0) {
        deltaText = `${formatCurrencyCompact(over)} over budget`;
        deltaClass = "down";
      } else {
        deltaText = `${formatCurrencyCompact(Math.abs(over))} under budget`;
        deltaClass = "up";
      }
    }
  }

  return (
    <WidgetShell isLoading={isLoading} isError={isError} className="kpi" refetch={refetch}>
      <div className="kpi">
        <div className="kpi-label">Projected Month-End</div>
        <div className="kpi-value">
          {data && formatCurrencyCompact(data.forecast.projected_usd)}
        </div>
        {deltaText && (
          <div className={`kpi-delta ${deltaClass}`}>{deltaText}</div>
        )}
      </div>
    </WidgetShell>
  );
}
