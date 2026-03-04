import type { RectangleProps } from "recharts";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Rectangle,
} from "recharts";
import { useMonthlySpend } from "../../hooks/useExecutiveSummary";
import { formatCurrencyCompact, formatCurrencyFull } from "../../formatters";
import WidgetShell from "../../components/WidgetShell";

function monthLabel(period: string): string {
  const [, m] = period.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return months[parseInt(m!, 10) - 1] ?? period;
}

interface BarEntry { label: string; value: number; forecast: boolean }

function SpendBar(props: RectangleProps & { payload?: BarEntry }) {
  const isForecast = props.payload?.forecast;
  return (
    <Rectangle
      {...props}
      fill="#4361ee"
      fillOpacity={isForecast ? 0.35 : 1}
      stroke={isForecast ? "#4361ee" : "none"}
      strokeDasharray={isForecast ? "4 2" : "none"}
      radius={[4, 4, 0, 0]}
    />
  );
}

export default function MonthlySpendChart() {
  const { data, isLoading, isError, refetch } = useMonthlySpend();

  const isEmpty = data && data.monthly_spend.length === 0;

  const bars: BarEntry[] = data
    ? [
        ...data.monthly_spend.map((m) => ({
          label: monthLabel(m.period),
          value: m.total_usd,
          forecast: false,
        })),
        ...data.monthly_spend_forecast.map((m) => ({
          label: monthLabel(m.period) + "*",
          value: m.projected_usd,
          forecast: true,
        })),
      ]
    : [];

  return (
    <WidgetShell isLoading={isLoading} isError={isError} isEmpty={isEmpty} className="card" refetch={refetch}>
      <div className="card">
        <div className="card-title">Monthly Spend + 3 Month Forecast</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={bars} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <XAxis dataKey="label" tick={{ fontSize: 10 }} />
            <YAxis tickFormatter={(v: number) => formatCurrencyCompact(v)} tick={{ fontSize: 10 }} width={50} />
            <Tooltip
              formatter={(v: number | undefined) => [formatCurrencyFull(v ?? 0), "Spend"]}
              cursor={{ fill: "var(--accent-light)" }}
            />
            <Bar dataKey="value" maxBarSize={32} shape={SpendBar} />
          </BarChart>
        </ResponsiveContainer>
        <div className="chart-legend">
          <span><span className="legend-dot" style={{ background: "#4361ee" }} /> Actual</span>
          <span><span className="legend-dot" style={{ background: "#4361ee", opacity: 0.35 }} /> Forecast</span>
        </div>
      </div>
    </WidgetShell>
  );
}
