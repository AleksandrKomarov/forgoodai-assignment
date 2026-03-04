import { useDateRange } from "../../context/DateRangeContext";
import { useTeamUserActivity } from "../../hooks/useTeamDrillDown";
import {
  formatCount,
  formatPercent,
  formatRelativeTime,
} from "../../formatters";
import WidgetShell from "../../components/WidgetShell";

interface Props {
  teamId: string;
}

function rateTag(rate: number) {
  if (rate >= 99) return <span className="tag green">{formatPercent(rate)}</span>;
  if (rate >= 95) return <span className="tag gray">{formatPercent(rate)}</span>;
  return <span className="tag red">{formatPercent(rate)}</span>;
}

export default function UserActivityTable({ teamId }: Props) {
  const { start, end } = useDateRange();
  const { data, isLoading, isError, refetch } = useTeamUserActivity(
    teamId,
    start,
    end,
  );

  const users = data?.users ?? [];

  return (
    <WidgetShell
      isLoading={isLoading}
      isError={isError}
      isEmpty={users.length === 0}
      className="card"
      refetch={refetch}
    >
      <div className="card">
        <div className="card-title">User Activity</div>
        <table className="wtable">
          <thead>
            <tr>
              <th>User</th>
              <th>Runs</th>
              <th>Success Rate</th>
              <th>Last Active</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.user_id}>
                <td><strong>{u.user_name}</strong></td>
                <td>{formatCount(u.run_count)}</td>
                <td>{rateTag(u.success_rate_pct)}</td>
                <td>{formatRelativeTime(u.last_active)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </WidgetShell>
  );
}
