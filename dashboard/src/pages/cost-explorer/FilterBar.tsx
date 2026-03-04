interface Props {
  dimension: "team" | "agent_type";
  granularity: "daily" | "weekly" | "monthly";
  onDimensionChange: (d: "team" | "agent_type") => void;
  onGranularityChange: (g: "daily" | "weekly" | "monthly") => void;
}

export default function FilterBar({
  dimension,
  granularity,
  onDimensionChange,
  onGranularityChange,
}: Props) {
  return (
    <div className="filter-bar">
      <span className="label">Dimension:</span>
      <select
        value={dimension}
        onChange={(e) => onDimensionChange(e.target.value as "team" | "agent_type")}
      >
        <option value="team">Team</option>
        <option value="agent_type">Agent Type</option>
      </select>
      <span className="label">Period:</span>
      <select
        value={granularity}
        onChange={(e) => onGranularityChange(e.target.value as "daily" | "weekly" | "monthly")}
      >
        <option value="daily">Daily</option>
        <option value="weekly">Weekly</option>
        <option value="monthly">Monthly</option>
      </select>
    </div>
  );
}
