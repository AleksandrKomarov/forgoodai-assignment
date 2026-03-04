import { useDateRange } from "../../context/DateRangeContext";
import { useRunVolume } from "../../hooks/useExecutiveSummary";
import { formatCount } from "../../formatters";
import { daysBetween } from "../../dateUtils";
import WidgetShell from "../../components/WidgetShell";

export default function RunVolumeSparkline() {
  const { start, end } = useDateRange();
  const { data, isLoading, isError, refetch } = useRunVolume(start, end);
  const days = daysBetween(start, end);

  const daily = data?.daily ?? [];
  const maxCount = Math.max(...daily.map((d) => d.count), 1);

  return (
    <WidgetShell isLoading={isLoading} isError={isError} isEmpty={daily.length === 0} className="card" refetch={refetch}>
      <div className="card">
        <div className="card-title">Run Volume ({days}d)</div>
        <div className="sparkline">
          {daily.map((d) => (
            <div
              key={d.date}
              className="sp-bar"
              title={`${d.date}: ${formatCount(d.count)} runs`}
              style={{ height: `${(d.count / maxCount) * 100}%` }}
            />
          ))}
        </div>
      </div>
    </WidgetShell>
  );
}
