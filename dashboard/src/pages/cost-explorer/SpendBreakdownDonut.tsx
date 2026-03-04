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

const CIRCUMFERENCE = 2 * Math.PI * 85;

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
      <div className="card" style={{ display: "flex", flexDirection: "column" }}>
        <div className="card-title">Spend Breakdown by Cost Driver</div>
        <div className="donut-container" style={{ flex: 1 }}>
          <svg viewBox="0 0 220 220" width="220" height="220">
            {arcs.map((arc) => (
              <circle
                key={arc.driver}
                cx="110"
                cy="110"
                r="85"
                fill="none"
                stroke={DRIVER_COLORS[arc.driver] ?? "#94a3b8"}
                strokeWidth="32"
                strokeDasharray={`${arc.arcLength} ${CIRCUMFERENCE}`}
                strokeDashoffset={arc.offset}
                transform="rotate(-90 110 110)"
              />
            ))}
            <text
              x="110"
              y="106"
              textAnchor="middle"
              fontSize="24"
              fontWeight="700"
              fill="var(--text)"
            >
              {data && formatCurrencyCompact(data.total_usd)}
            </text>
            <text
              x="110"
              y="126"
              textAnchor="middle"
              fontSize="12"
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
