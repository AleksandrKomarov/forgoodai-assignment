import { useDateRange } from "../../context/DateRangeContext";
import { useTeamSummary } from "../../hooks/useTeamDrillDown";
import {
  formatCount,
  formatCurrencyCompact,
  formatPercent,
  getDeltaClass,
} from "../../formatters";
import WidgetShell from "../../components/WidgetShell";

interface Props {
  teamId: string;
}

export default function TeamKpiRow({ teamId }: Props) {
  const { start, end } = useDateRange();
  const { data, isLoading, isError, refetch } = useTeamSummary(
    teamId,
    start,
    end,
  );

  return (
    <WidgetShell isLoading={isLoading} isError={isError} refetch={refetch}>
      <div className="kpi-row">
        <div className="kpi">
          <div className="kpi-label">Runs</div>
          <div className="kpi-value">
            {data && formatCount(data.runs.total)}
          </div>
          <div
            className={`kpi-delta ${data ? getDeltaClass(data.runs.delta_pct, "count") : ""}`}
          >
            {data &&
              `${data.runs.delta_pct > 0 ? "+" : ""}${data.runs.delta_pct}%`}
          </div>
        </div>

        <div className="kpi">
          <div className="kpi-label">Spend</div>
          <div className="kpi-value">
            {data && formatCurrencyCompact(data.spend.spend_usd)}
          </div>
          <div
            className={`kpi-delta ${data ? getDeltaClass(data.spend.delta_pct, "cost") : ""}`}
          >
            {data &&
              `${data.spend.delta_pct > 0 ? "+" : ""}${data.spend.delta_pct}%`}
          </div>
        </div>

        <div className="kpi">
          <div className="kpi-label">Success Rate</div>
          <div className="kpi-value" style={{ color: "var(--green)" }}>
            {data && formatPercent(data.success_rate.rate_pct)}
          </div>
          <div
            className={`kpi-delta ${data ? getDeltaClass(data.success_rate.delta_pp, "rate") : ""}`}
          >
            {data &&
              `${data.success_rate.delta_pp > 0 ? "+" : ""}${data.success_rate.delta_pp.toFixed(1)}pp`}
          </div>
        </div>

        <div className="kpi">
          <div className="kpi-label">Active Users</div>
          <div className="kpi-value">
            {data && formatCount(data.active_users.count)}
          </div>
          <div
            className={`kpi-delta ${data ? getDeltaClass(data.active_users.delta, "count") : ""}`}
          >
            {data &&
              `${data.active_users.delta > 0 ? "+" : ""}${data.active_users.delta} vs prior`}
          </div>
        </div>
      </div>
    </WidgetShell>
  );
}
