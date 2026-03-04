import { useDateRange } from "../../context/DateRangeContext";
import { useSuccessFailureTimeseries } from "../../hooks/usePerformance";
import { formatCount } from "../../formatters";
import WidgetShell from "../../components/WidgetShell";

function formatLabel(date: string): string {
  const d = new Date(date + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function SuccessFailureChart() {
  const { start, end } = useDateRange();
  const { data, isLoading, isError, refetch } = useSuccessFailureTimeseries(start, end);

  const daily = data?.daily ?? [];

  const maxRuns =
    daily.length > 0
      ? Math.max(...daily.map((d) => d.completed + d.failed))
      : 1;

  return (
    <WidgetShell
      isLoading={isLoading}
      isError={isError}
      isEmpty={daily.length === 0}
      className="card"
      refetch={refetch}
    >
      <div className="card">
        <div className="card-title">Success / Failure Rates Over Time</div>
        <div className="sf-chart" style={{ height: 180 }}>
          {daily.map((d) => {
            const successPct = (d.completed / maxRuns) * 100;
            const failPct = (d.failed / maxRuns) * 100;
            return (
              <div
                className="sf-bar-col"
                key={d.date}
                title={`${formatCount(d.completed)} success, ${formatCount(d.failed)} failed`}
              >
                <div
                  className="sf-bar-success"
                  style={{ height: `${successPct}%` }}
                />
                {d.failed > 0 && (
                  <div
                    className="sf-bar-failure"
                    style={{ height: `${failPct}%` }}
                  />
                )}
              </div>
            );
          })}
        </div>
        <div className="sf-labels" style={{ display: "flex", gap: 3 }}>
          {daily.map((d, i) => (
            <div
              key={d.date}
              style={{
                flex: 1,
                maxWidth: 18,
                textAlign: "center",
                fontSize: 9,
                color: "var(--text2)",
                whiteSpace: "nowrap",
                overflow: "hidden",
              }}
            >
              {i % 5 === 0 ? formatLabel(d.date) : ""}
            </div>
          ))}
        </div>
        <div className="chart-legend">
          <span>
            <span className="legend-dot" style={{ background: "var(--green)" }} />
            Success
          </span>
          <span>
            <span className="legend-dot" style={{ background: "var(--red)" }} />
            Failed
          </span>
        </div>
      </div>
    </WidgetShell>
  );
}
