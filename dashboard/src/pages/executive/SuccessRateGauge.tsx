import { useDateRange } from "../../context/DateRangeContext";
import { useSuccessRate } from "../../hooks/useExecutiveSummary";
import { formatPercent } from "../../formatters";
import { daysBetween } from "../../dateUtils";
import WidgetShell from "../../components/WidgetShell";

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function SuccessRateGauge() {
  const { start, end } = useDateRange();
  const { data, isLoading, isError, refetch } = useSuccessRate(start, end);
  const days = daysBetween(start, end);

  const dashoffset = data ? CIRCUMFERENCE * (1 - data.rate_pct / 100) : CIRCUMFERENCE;

  return (
    <WidgetShell isLoading={isLoading} isError={isError} className="card" refetch={refetch}>
      <div className="card">
        <div className="card-title">Overall Success Rate</div>
        <div className="gauge">
          <svg viewBox="0 0 120 120" width="120" height="120">
            <circle
              cx="60" cy="60" r={RADIUS}
              stroke="var(--border)" strokeWidth="10" fill="none"
            />
            <circle
              cx="60" cy="60" r={RADIUS}
              stroke="var(--green)" strokeWidth="10" fill="none"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashoffset}
              strokeLinecap="round"
            />
          </svg>
          <div className="gauge-label">
            <div className="val">{data && formatPercent(data.rate_pct)}</div>
            <div className="sub">{days}-day avg</div>
          </div>
        </div>
      </div>
    </WidgetShell>
  );
}
