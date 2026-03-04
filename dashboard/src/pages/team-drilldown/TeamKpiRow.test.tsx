import { render, screen } from "@testing-library/react";
import TeamKpiRow from "./TeamKpiRow";

vi.mock("../../formatters", () => ({
  formatCount: (v: number) => `${v}`,
  formatCurrencyCompact: (v: number) => `$${v}`,
  formatPercent: (v: number) => `${v}%`,
  getDeltaClass: (v: number, type: string) => {
    if (v === 0) return "";
    if (type === "cost") return v > 0 ? "down" : "up";
    return v > 0 ? "up" : "down";
  },
}));

vi.mock("../../context/DateRangeContext", () => ({
  useDateRange: () => ({ start: "2026-02-03", end: "2026-03-04" }),
}));

const mockUseTeamSummary = vi.fn();
vi.mock("../../hooks/useTeamDrillDown", () => ({
  useTeamSummary: (...args: unknown[]) => mockUseTeamSummary(...args),
}));

describe("TeamKpiRow", () => {
  it("shows skeleton while loading", () => {
    mockUseTeamSummary.mockReturnValue({ isLoading: true, isError: false });
    const { container } = render(<TeamKpiRow teamId="t1" />);
    expect(container.querySelector(".skeleton")).toBeInTheDocument();
  });

  it("renders all 4 KPI labels", () => {
    mockUseTeamSummary.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        runs: { total: 1200, prior_total: 1140, delta_pct: 5.2 },
        spend: { spend_usd: 8400, prior_spend_usd: 8668, delta_pct: -3.1 },
        success_rate: { rate_pct: 96.3, prior_rate_pct: 95.8, delta_pp: 0.5 },
        active_users: { count: 12, prior_count: 10, delta: 2 },
      },
    });
    render(<TeamKpiRow teamId="t1" />);
    expect(screen.getByText("Runs")).toBeInTheDocument();
    expect(screen.getByText("Spend")).toBeInTheDocument();
    expect(screen.getByText("Success Rate")).toBeInTheDocument();
    expect(screen.getByText("Active Users")).toBeInTheDocument();
  });

  it("renders KPI values", () => {
    mockUseTeamSummary.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        runs: { total: 1200, prior_total: 1140, delta_pct: 5.2 },
        spend: { spend_usd: 8400, prior_spend_usd: 8668, delta_pct: -3.1 },
        success_rate: { rate_pct: 96.3, prior_rate_pct: 95.8, delta_pp: 0.5 },
        active_users: { count: 12, prior_count: 10, delta: 2 },
      },
    });
    render(<TeamKpiRow teamId="t1" />);
    expect(screen.getByText("1200")).toBeInTheDocument();
    expect(screen.getByText("$8400")).toBeInTheDocument();
    expect(screen.getByText("96.3%")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("renders spend delta with cost semantics (increase = down/red)", () => {
    mockUseTeamSummary.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        runs: { total: 1200, prior_total: 1200, delta_pct: 0 },
        spend: { spend_usd: 8400, prior_spend_usd: 7602, delta_pct: 10.5 },
        success_rate: { rate_pct: 96.3, prior_rate_pct: 96.3, delta_pp: 0 },
        active_users: { count: 12, prior_count: 12, delta: 0 },
      },
    });
    render(<TeamKpiRow teamId="t1" />);
    const delta = screen.getByText("+10.5%");
    expect(delta.className).toContain("down");
  });
});
