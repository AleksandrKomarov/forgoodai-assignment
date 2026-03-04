import { useAgentAdoption } from "../../hooks/useUsageCapacity";
import WidgetShell from "../../components/WidgetShell";

export default function NewAgentTypesKpiCard() {
  const { data, isLoading, isError, refetch } = useAgentAdoption();
  const current = data?.current_month;

  let subtitle = "";
  if (current) {
    const types = current.new_types;
    if (types.length <= 3) {
      subtitle = types.join(", ");
    } else {
      subtitle = `${types.slice(0, 3).join(", ")} + ${types.length - 3} more`;
    }
  }

  return (
    <WidgetShell
      isLoading={isLoading}
      isError={isError}
      className="kpi"
      refetch={refetch}
    >
      <div className="kpi">
        <div className="kpi-label">New Agent Types (this month)</div>
        <div className="kpi-value">{current?.new_count}</div>
        <div className="kpi-delta">{subtitle}</div>
      </div>
    </WidgetShell>
  );
}
