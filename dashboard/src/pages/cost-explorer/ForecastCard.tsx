import { useBudgetForecast } from "../../hooks/useExecutiveSummary";
import { formatCurrencyFull, formatCurrencyCompact } from "../../formatters";
import WidgetShell from "../../components/WidgetShell";

export default function ForecastCard() {
  const { data, isLoading, isError, refetch } = useBudgetForecast();

  const hasBudget = data?.burn_rate.budget_usd != null;
  const projectedPct = data?.forecast.projected_budget_pct ?? 0;
  const overBudget = data?.forecast.projected_over_budget_usd ?? null;

  let overUnderLabel: string | null = null;
  let overUnderColor = "";
  if (data && overBudget !== null) {
    if (overBudget > 0) {
      overUnderLabel = `${Math.round(projectedPct)}% of budget — ${formatCurrencyCompact(overBudget)} over`;
      overUnderColor = "var(--red)";
    } else {
      overUnderLabel = `${Math.round(projectedPct)}% of budget — ${formatCurrencyCompact(Math.abs(overBudget))} under`;
      overUnderColor = "var(--green)";
    }
  }

  const fillStyle =
    projectedPct > 100
      ? "linear-gradient(90deg, var(--accent), var(--red))"
      : "var(--accent)";

  return (
    <WidgetShell isLoading={isLoading} isError={isError} className="card" refetch={refetch}>
      <div className="card">
        <div className="card-title">Forecasted Month-End Spend</div>
        <div className="large-value">
          {data && formatCurrencyFull(data.forecast.projected_usd)}
        </div>
        {hasBudget && data && (
          <>
            <div className="large-value-subtitle">
              Budget: {formatCurrencyFull(data.burn_rate.budget_usd!)}
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{
                  width: `${Math.min(projectedPct, 120)}%`,
                  background: fillStyle,
                }}
              />
            </div>
            {overUnderLabel && (
              <div className="large-value-context" style={{ color: overUnderColor }}>
                {overUnderLabel}
              </div>
            )}
          </>
        )}
      </div>
    </WidgetShell>
  );
}
