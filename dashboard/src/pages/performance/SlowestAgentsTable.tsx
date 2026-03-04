import { useDateRange } from "../../context/DateRangeContext";
import { useSlowestAgents } from "../../hooks/usePerformance";
import { formatDuration, formatCount } from "../../formatters";
import WidgetShell from "../../components/WidgetShell";

export default function SlowestAgentsTable() {
  const { start, end } = useDateRange();
  const { data, isLoading, isError, refetch } = useSlowestAgents(start, end);

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
        <div className="card-title">Slowest Agents (Top 10 by Avg Duration)</div>
        <table className="wtable">
          <thead>
            <tr>
              <th>Agent</th>
              <th>Avg Duration</th>
              <th>Runs</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((a) => (
              <tr key={a.agent_type}>
                <td>{a.agent_type}</td>
                <td>{formatDuration(a.avg_duration_ms)}</td>
                <td>{formatCount(a.run_count)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </WidgetShell>
  );
}
