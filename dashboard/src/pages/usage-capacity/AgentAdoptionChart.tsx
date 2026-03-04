import { useAgentAdoption } from "../../hooks/useUsageCapacity";
import WidgetShell from "../../components/WidgetShell";

function formatMonth(month: string): string {
  const d = new Date(month + "-01T00:00:00");
  return d.toLocaleDateString(undefined, { month: "short" });
}

export default function AgentAdoptionChart() {
  const { data, isLoading, isError, refetch } = useAgentAdoption();

  const months = data?.months ?? [];
  const maxCount = months.length > 0 ? Math.max(...months.map((m) => m.new_count)) : 1;

  return (
    <WidgetShell
      isLoading={isLoading}
      isError={isError}
      isEmpty={months.length === 0}
      className="card"
      refetch={refetch}
    >
      <div className="card">
        <div className="card-title">New Agent Types Adopted (Last 6 Months)</div>
        <div className="adoption-chart" style={{ height: 200, justifyContent: "space-evenly" }}>
          {months.map((m) => (
            <div
              key={m.month}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-end",
                height: "100%",
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                {m.new_count}
              </div>
              <div
                className="adoption-bar"
                style={{
                  height: `${(m.new_count / maxCount) * 100}%`,
                  minHeight: 4,
                }}
                title={m.new_types.join(", ")}
              />
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text2)",
                  marginTop: 6,
                }}
              >
                {formatMonth(m.month)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </WidgetShell>
  );
}
