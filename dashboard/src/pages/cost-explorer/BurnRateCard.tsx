import { useBudgetForecast } from "../../hooks/useExecutiveSummary";
import WidgetShell from "../../components/WidgetShell";

export default function BurnRateCard() {
  const { data, isLoading, isError, refetch } = useBudgetForecast();

  const hasBudget = data?.burn_rate.budget_usd != null;
  const burnPct = data?.burn_rate.burn_pct;
  const onTrack = data?.burn_rate.on_track ?? true;

  return (
    <WidgetShell isLoading={isLoading} isError={isError} className="card" refetch={refetch}>
      <div className="card">
        <div className="card-title">Budget Burn Rate</div>
        {hasBudget && burnPct != null ? (
          <>
            <div
              className="large-value"
              style={{ color: onTrack ? "var(--green)" : "var(--red)" }}
            >
              {Math.round(burnPct)}%
            </div>
            <div className="large-value-subtitle">of monthly budget consumed</div>
            {data && (
              <div className="large-value-context">
                Day {data.days_elapsed} of {data.days_in_month} (
                {Math.round(data.burn_rate.month_progress_pct)}% through month)
              </div>
            )}
          </>
        ) : (
          <div className="large-value-subtitle">No budget configured</div>
        )}
      </div>
    </WidgetShell>
  );
}
