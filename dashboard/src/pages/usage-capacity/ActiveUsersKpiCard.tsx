import { useDateRange } from "../../context/DateRangeContext";
import { useActiveUsers } from "../../hooks/useUsageCapacity";
import { formatCount } from "../../formatters";
import WidgetShell from "../../components/WidgetShell";

export default function ActiveUsersKpiCard() {
  const { start, end } = useDateRange();
  const { data, isLoading, isError, refetch } = useActiveUsers(start, end);

  const deltaClass = data
    ? data.delta_users === 0
      ? ""
      : data.delta_users > 0
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
        <div className="kpi-label">
          Active Users{data ? ` (${data.days}d)` : ""}
        </div>
        <div className="kpi-value">{data && formatCount(data.active_users)}</div>
        <div className={`kpi-delta ${deltaClass}`}>
          {data &&
            `${data.delta_users > 0 ? "+" : ""}${data.delta_users} vs prior period`}
        </div>
      </div>
    </WidgetShell>
  );
}
