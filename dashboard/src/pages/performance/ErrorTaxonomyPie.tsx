import { useDateRange } from "../../context/DateRangeContext";
import { useErrorTaxonomy } from "../../hooks/usePerformance";
import { formatCount } from "../../formatters";
import WidgetShell from "../../components/WidgetShell";

const ERROR_COLORS = ["#ef4444", "#f97316", "#f59e0b", "#fb923c", "#fbbf24"];

const CIRCUMFERENCE = 2 * Math.PI * 85;

export default function ErrorTaxonomyPie() {
  const { start, end } = useDateRange();
  const { data, isLoading, isError, refetch } = useErrorTaxonomy(start, end);

  const errors = data?.errors ?? [];

  let cumulativeOffset = 0;
  const arcs = errors.map((e) => {
    const arcLength = (e.pct / 100) * CIRCUMFERENCE;
    const offset = -cumulativeOffset;
    cumulativeOffset += arcLength;
    return { ...e, arcLength, offset };
  });

  return (
    <WidgetShell
      isLoading={isLoading}
      isError={isError}
      isEmpty={errors.length === 0}
      className="card"
      refetch={refetch}
    >
      <div className="card" style={{ display: "flex", flexDirection: "column" }}>
        <div className="card-title">Error Taxonomy</div>
        <div className="donut-container" style={{ flex: 1 }}>
          <svg viewBox="0 0 220 220" width="220" height="220">
            {arcs.map((arc, i) => (
              <circle
                key={arc.error_code}
                cx="110"
                cy="110"
                r="85"
                fill="none"
                stroke={ERROR_COLORS[i % ERROR_COLORS.length]}
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
              {data && formatCount(data.total_failures)}
            </text>
            <text
              x="110"
              y="126"
              textAnchor="middle"
              fontSize="12"
              fill="var(--text2)"
            >
              failures
            </text>
          </svg>
          <div className="donut-legend">
            {arcs.map((arc, i) => (
              <div className="donut-legend-row" key={arc.error_code}>
                <span
                  className="legend-dot"
                  style={{ background: ERROR_COLORS[i % ERROR_COLORS.length] }}
                />
                <span>
                  {arc.error_code} — {arc.pct}% ({formatCount(arc.count)})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </WidgetShell>
  );
}
