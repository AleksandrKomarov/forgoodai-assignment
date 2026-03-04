import { useDateRange } from "../../context/DateRangeContext";
import { useRunHeatmap } from "../../hooks/useUsageCapacity";
import { daysBetween } from "../../dateUtils";
import WidgetShell from "../../components/WidgetShell";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function RunHeatmap() {
  const { start, end } = useDateRange();
  const { data, isLoading, isError, refetch } = useRunHeatmap(start, end);
  const exceeded = daysBetween(start, end) > 90;

  const cells = data?.cells ?? [];
  const maxCount = cells.length > 0 ? Math.max(...cells.map((c) => c.run_count)) : 1;

  // Build lookup: [day][hour] → run_count
  const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0) as number[]);
  for (const c of cells) {
    grid[c.day_of_week]![c.hour_of_day] = c.run_count;
  }

  return (
    <WidgetShell
      isLoading={!exceeded && isLoading}
      isError={!exceeded && isError}
      isEmpty={!exceeded && cells.length === 0}
      className="card"
      refetch={refetch}
    >
      <div className="card">
        <div className="card-title">Run Heatmap (Day × Hour)</div>
        {exceeded ? (
          <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 8 }}>
            Heatmap data is limited to 90-day ranges.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="heatmap-table" style={{ borderCollapse: "collapse", width: "100%" }}>
              <thead>
                <tr>
                  <th style={{ width: 40 }} />
                  {Array.from({ length: 24 }, (_, h) => (
                    <th
                      key={h}
                      style={{
                        fontSize: 10,
                        color: "var(--text2)",
                        fontWeight: 400,
                        padding: "2px 0",
                        textAlign: "center",
                      }}
                    >
                      {h % 3 === 0 ? `${h}h` : ""}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAY_LABELS.map((label, day) => (
                  <tr key={day}>
                    <td
                      style={{
                        fontSize: 11,
                        color: "var(--text2)",
                        fontWeight: 500,
                        paddingRight: 6,
                      }}
                    >
                      {label}
                    </td>
                    {Array.from({ length: 24 }, (_, hour) => {
                      const count = grid[day]![hour]!;
                      const opacity = maxCount > 0 ? 0.05 + (count / maxCount) * 0.95 : 0.05;
                      return (
                        <td
                          key={hour}
                          className="heatmap-cell"
                          title={`${label} ${hour}:00 — ${count} runs`}
                          style={{
                            background: "var(--accent)",
                            opacity,
                            width: 28,
                            height: 28,
                            padding: 1,
                            borderRadius: 3,
                          }}
                        />
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </WidgetShell>
  );
}
