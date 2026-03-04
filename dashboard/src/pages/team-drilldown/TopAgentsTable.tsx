import { useDateRange } from "../../context/DateRangeContext";
import { useTeamTopAgents } from "../../hooks/useTeamDrillDown";
import {
  formatCount,
  formatPercent,
  formatDuration,
  formatCurrencyFull,
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

export default function TopAgentsTable({ teamId }: Props) {
  const { start, end } = useDateRange();
  const { data, isLoading, isError, refetch } = useTeamTopAgents(
    teamId,
    start,
    end,
  );

  const agents = data?.agents ?? [];

  return (
    <WidgetShell
      isLoading={isLoading}
      isError={isError}
      isEmpty={agents.length === 0}
      className="card"
      refetch={refetch}
    >
      <div className="card">
        <div className="card-title">Top Agents</div>
        <table className="wtable">
          <thead>
            <tr>
              <th>Agent Type</th>
              <th>Runs</th>
              <th>Success Rate</th>
              <th>Avg Duration</th>
              <th>Spend</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((a) => (
              <tr key={a.agent_type}>
                <td><strong>{a.agent_type}</strong></td>
                <td>{formatCount(a.run_count)}</td>
                <td>{rateTag(a.success_rate_pct)}</td>
                <td>{formatDuration(a.avg_duration_ms)}</td>
                <td>{formatCurrencyFull(a.spend_usd)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </WidgetShell>
  );
}
