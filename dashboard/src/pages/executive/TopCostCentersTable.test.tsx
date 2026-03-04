import { render, screen } from "@testing-library/react";
import TopCostCentersTable from "./TopCostCentersTable";

vi.mock("../../formatters", () => ({
  formatCurrencyFull: (v: number) => `$${v}`,
  formatCount: (v: number) => `${v}`,
  formatCurrencyPrecise: (v: number) => `$${v.toFixed(2)}`,
}));

vi.mock("../../context/DateRangeContext", () => ({
  useDateRange: () => ({ start: "2026-02-03", end: "2026-03-04" }),
}));

const mockUseTopCostCenters = vi.fn();
vi.mock("../../hooks/useExecutiveSummary", () => ({
  useTopCostCenters: (...args: unknown[]) => mockUseTopCostCenters(...args),
}));

describe("TopCostCentersTable", () => {
  it("shows skeleton while loading", () => {
    mockUseTopCostCenters.mockReturnValue({ isLoading: true, isError: false });
    const { container } = render(<TopCostCentersTable />);
    expect(container.querySelector(".skeleton")).toBeInTheDocument();
  });

  it("renders table headers with day count", () => {
    mockUseTopCostCenters.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        teams: [{ team_id: "t1", team_name: "Alpha", spend_usd: 5000, run_count: 100, delta_pct: 3 }],
      },
    });
    render(<TopCostCentersTable />);
    expect(screen.getByText("Spend (30d)")).toBeInTheDocument();
    expect(screen.getByText("Team")).toBeInTheDocument();
    expect(screen.getByText("Runs")).toBeInTheDocument();
    expect(screen.getByText("Avg Cost/Run")).toBeInTheDocument();
    expect(screen.getByText("Share")).toBeInTheDocument();
  });

  it("renders team data rows", () => {
    mockUseTopCostCenters.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        teams: [
          { team_id: "t1", team_name: "Alpha", spend_usd: 6000, run_count: 120, delta_pct: 5 },
          { team_id: "t2", team_name: "Beta", spend_usd: 4000, run_count: 100, delta_pct: -2 },
        ],
      },
    });
    render(<TopCostCentersTable />);
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
    expect(screen.getByText("$50.00")).toBeInTheDocument(); // 6000/120 Alpha
    expect(screen.getByText("$40.00")).toBeInTheDocument(); // 4000/100 Beta
    expect(screen.getByText("60.0%")).toBeInTheDocument(); // 6000/10000
    expect(screen.getByText("40.0%")).toBeInTheDocument(); // 4000/10000
  });

  it("shows empty state when no teams", () => {
    mockUseTopCostCenters.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { teams: [] },
    });
    render(<TopCostCentersTable />);
    expect(screen.getByText("No data for selected period")).toBeInTheDocument();
  });
});
