import { useDateRange } from "../../context/DateRangeContext";
import { useTopCostCenters } from "../../hooks/useExecutiveSummary";
import { formatCurrencyFull, formatCount, formatCurrencyPrecise } from "../../formatters";
import { daysBetween } from "../../dateUtils";
import WidgetShell from "../../components/WidgetShell";

export default function TopCostCentersTable() {
  const { start, end } = useDateRange();
  const { data, isLoading, isError, refetch } = useTopCostCenters(start, end);
  const days = daysBetween(start, end);

  const teams = data?.teams ?? [];
  const totalSpend = teams.reduce((sum, t) => sum + t.spend_usd, 0) || 1;

  return (
    <WidgetShell isLoading={isLoading} isError={isError} isEmpty={teams.length === 0} className="card" refetch={refetch}>
      <div className="card">
        <div className="card-title">Top 3 Cost Centers (by Team)</div>
        <table className="wtable">
          <thead>
            <tr>
              <th>Team</th>
              <th>Spend ({days}d)</th>
              <th>Runs</th>
              <th>Avg Cost/Run</th>
              <th>Share</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((t) => (
              <tr key={t.team_id}>
                <td><strong>{t.team_name}</strong></td>
                <td>{formatCurrencyFull(t.spend_usd)}</td>
                <td>{formatCount(t.run_count)}</td>
                <td>{formatCurrencyPrecise(t.spend_usd / t.run_count)}</td>
                <td>
                  <div className="bar-container">
                    <div
                      className="bar"
                      style={{ width: `${(t.spend_usd / totalSpend) * 100}%`, minWidth: 4 }}
                    />
                  </div>
                  <span style={{ fontSize: 11 }}>{((t.spend_usd / totalSpend) * 100).toFixed(1)}%</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </WidgetShell>
  );
}
