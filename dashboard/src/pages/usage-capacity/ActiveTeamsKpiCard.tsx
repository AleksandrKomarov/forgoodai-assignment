import { useDateRange } from "../../context/DateRangeContext";
import { useActiveUsers } from "../../hooks/useUsageCapacity";
import WidgetShell from "../../components/WidgetShell";

export default function ActiveTeamsKpiCard() {
  const { start, end } = useDateRange();
  const { data, isLoading, isError, refetch } = useActiveUsers(start, end);

  return (
    <WidgetShell
      isLoading={isLoading}
      isError={isError}
      className="kpi"
      refetch={refetch}
    >
      <div className="kpi">
        <div className="kpi-label">Active Teams</div>
        <div className="kpi-value">{data?.active_teams}</div>
        <div className="kpi-delta">
          {data && `${data.active_teams} of ${data.total_teams}`}
        </div>
      </div>
    </WidgetShell>
  );
}
