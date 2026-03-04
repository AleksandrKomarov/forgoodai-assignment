import { useDateRange } from "../../context/DateRangeContext";
import { useRunVolumeByTeam } from "../../hooks/useUsageCapacity";
import { formatCount } from "../../formatters";
import WidgetShell from "../../components/WidgetShell";

export default function RunVolumeByTeamChart() {
  const { start, end } = useDateRange();
  const { data, isLoading, isError, refetch } = useRunVolumeByTeam(start, end);

  const teams = data?.teams ?? [];
  const maxCount = teams.length > 0 ? Math.max(...teams.map((t) => t.run_count)) : 1;

  return (
    <WidgetShell
      isLoading={isLoading}
      isError={isError}
      isEmpty={teams.length === 0}
      className="card"
      refetch={refetch}
    >
      <div className="card">
        <div className="card-title">Run Volume by Team</div>
        {teams.map((t) => (
          <div className="run-volume-row" key={t.team_id}>
            <div style={{ width: 80, fontSize: 13, fontWeight: 500 }}>
              {t.team_name}
            </div>
            <div className="run-volume-track">
              <div
                className="run-volume-fill"
                style={{ width: `${(t.run_count / maxCount) * 100}%` }}
              />
            </div>
            <div style={{ width: 60, textAlign: "right", fontSize: 13 }}>
              {formatCount(t.run_count)}
            </div>
          </div>
        ))}
      </div>
    </WidgetShell>
  );
}
