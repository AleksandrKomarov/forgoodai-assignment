import { useEffect } from "react";
import { useTeamList } from "../../hooks/useTeamDrillDown";
import WidgetShell from "../../components/WidgetShell";

interface Props {
  selected: string;
  onSelect: (teamId: string) => void;
}

export default function TeamSelector({ selected, onSelect }: Props) {
  const { data, isLoading, isError, refetch } = useTeamList();

  const teams = data?.teams ?? [];

  useEffect(() => {
    if (!selected && teams.length > 0) {
      onSelect(teams[0]!.team_id);
    }
  }, [selected, teams, onSelect]);

  return (
    <WidgetShell
      isLoading={isLoading}
      isError={isError}
      isEmpty={teams.length === 0}
      refetch={refetch}
    >
      <div className="pill-nav">
        {teams.map((t) => (
          <button
            key={t.team_id}
            className={selected === t.team_id ? "active" : ""}
            onClick={() => onSelect(t.team_id)}
          >
            {t.team_name}
          </button>
        ))}
      </div>
    </WidgetShell>
  );
}
