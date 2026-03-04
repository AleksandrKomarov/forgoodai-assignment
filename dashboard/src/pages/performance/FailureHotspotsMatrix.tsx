import { useDateRange } from "../../context/DateRangeContext";
import { useFailureHotspots } from "../../hooks/usePerformance";
import WidgetShell from "../../components/WidgetShell";

function rateTag(rate: number | undefined) {
  if (rate == null) return <span className="tag gray">—</span>;
  const cls = rate < 2 ? "green" : rate >= 5 ? "red" : "gray";
  return <span className={`tag ${cls}`}>{rate.toFixed(1)}%</span>;
}

export default function FailureHotspotsMatrix() {
  const { start, end } = useDateRange();
  const { data, isLoading, isError, refetch } = useFailureHotspots(start, end);

  const teams = data?.teams ?? [];
  const cells = data?.cells ?? [];

  // Pivot cells into a map: agentType -> teamId -> rate
  const matrix = new Map<string, Map<string, number>>();
  for (const cell of cells) {
    if (!matrix.has(cell.agent_type)) {
      matrix.set(cell.agent_type, new Map());
    }
    matrix.get(cell.agent_type)!.set(cell.team_id, cell.failure_rate_pct);
  }

  const agentTypes = [...matrix.keys()];

  return (
    <WidgetShell
      isLoading={isLoading}
      isError={isError}
      isEmpty={agentTypes.length === 0}
      className="card"
      refetch={refetch}
    >
      <div className="card">
        <div className="card-title">Failure Hotspots: Agent Type x Team</div>
        <table className="wtable">
          <thead>
            <tr>
              <th></th>
              {teams.map((t) => (
                <th key={t.team_id}>{t.team_name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {agentTypes.map((agent) => (
              <tr key={agent}>
                <td style={{ fontWeight: 600 }}>{agent}</td>
                {teams.map((t) => (
                  <td key={t.team_id}>
                    {rateTag(matrix.get(agent)?.get(t.team_id))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </WidgetShell>
  );
}
