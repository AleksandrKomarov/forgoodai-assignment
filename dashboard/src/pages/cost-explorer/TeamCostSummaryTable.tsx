import { useDateRange } from "../../context/DateRangeContext";
import { useTeamCostSummary } from "../../hooks/useCostExplorer";
import { formatCurrencyFull, formatCount, formatCurrencyPrecise } from "../../formatters";
import WidgetShell from "../../components/WidgetShell";

function deltaTag(delta: number) {
  if (delta > 0) return <span className="tag red">+{Math.round(delta)}%</span>;
  if (delta < 0) return <span className="tag green">{Math.round(delta)}%</span>;
  return <span className="tag gray">0%</span>;
}

export default function TeamCostSummaryTable() {
  const { start, end } = useDateRange();
  const { data, isLoading, isError, refetch } = useTeamCostSummary(start, end);

  const teams = data?.teams ?? [];
  const maxShare = Math.max(...teams.map((t) => t.share_pct), 1);

  return (
    <WidgetShell
      isLoading={isLoading}
      isError={isError}
      isEmpty={teams.length === 0}
      className="card"
      refetch={refetch}
    >
      <div className="card">
        <div className="card-title">Per-Team Cost Summary</div>
        <table className="wtable">
          <thead>
            <tr>
              <th>Team</th>
              <th>Spend</th>
              <th>Runs</th>
              <th>Avg $/Run</th>
              <th>vs Prior Period</th>
              <th>Share</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((t) => (
              <tr key={t.team_id}>
                <td><strong>{t.team_name}</strong></td>
                <td>{formatCurrencyFull(t.spend_usd)}</td>
                <td>{formatCount(t.run_count)}</td>
                <td>{formatCurrencyPrecise(t.avg_cost_per_run)}</td>
                <td>{deltaTag(t.delta_pct)}</td>
                <td>
                  <div className="bar-container">
                    <div
                      className="bar"
                      style={{ width: `${(t.share_pct / maxShare) * 100}%`, minWidth: 4 }}
                    />
                  </div>
                  <span style={{ fontSize: 11 }}>{t.share_pct}%</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </WidgetShell>
  );
}
