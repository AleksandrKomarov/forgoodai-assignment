import { useDateRange } from "../../context/DateRangeContext";
import { useSpendBreakdown } from "../../hooks/useCostExplorer";
import { formatCurrencyCompact } from "../../formatters";
import WidgetShell from "../../components/WidgetShell";

const DRIVER_COLORS: Record<string, string> = {
  tokens: "#4361ee",
  compute: "#22c55e",
  storage: "#f59e0b",
  egress: "#ef4444",
  other: "#94a3b8",
};

const CIRCUMFERENCE = 2 * Math.PI * 70;

export default function SpendBreakdownDonut() {
  const { start, end } = useDateRange();
  const { data, isLoading, isError, refetch } = useSpendBreakdown(start, end);

  const drivers = data?.drivers ?? [];

  let cumulativeOffset = 0;
  const arcs = drivers.map((d) => {
    const arcLength = (d.pct / 100) * CIRCUMFERENCE;
    const offset = -cumulativeOffset;
    cumulativeOffset += arcLength;
    return { ...d, arcLength, offset };
  });

  return (
    <WidgetShell
      isLoading={isLoading}
      isError={isError}
      isEmpty={drivers.length === 0}
      className="card"
      refetch={refetch}
    >
      <div className="card">
        <div className="card-title">Spend Breakdown by Cost Driver</div>
        <div className="donut-container">
          <svg viewBox="0 0 180 180" width="180" height="180">
            {arcs.map((arc) => (
              <circle
                key={arc.driver}
                cx="90"
                cy="90"
                r="70"
                fill="none"
                stroke={DRIVER_COLORS[arc.driver] ?? "#94a3b8"}
                strokeWidth="28"
                strokeDasharray={`${arc.arcLength} ${CIRCUMFERENCE}`}
                strokeDashoffset={arc.offset}
                transform="rotate(-90 90 90)"
              />
            ))}
            <text
              x="90"
              y="85"
              textAnchor="middle"
              fontSize="22"
              fontWeight="700"
              fill="var(--text)"
            >
              {data && formatCurrencyCompact(data.total_usd)}
            </text>
            <text
              x="90"
              y="103"
              textAnchor="middle"
              fontSize="11"
              fill="var(--text2)"
            >
              total spend
            </text>
          </svg>
          <div className="donut-legend">
            {arcs.map((arc) => (
              <div className="donut-legend-row" key={arc.driver}>
                <span
                  className="legend-dot"
                  style={{ background: DRIVER_COLORS[arc.driver] ?? "#94a3b8" }}
                />
                <span>
                  {arc.driver} — {arc.pct}% ({formatCurrencyCompact(arc.spend_usd)})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </WidgetShell>
  );
}
