import { render, screen } from "@testing-library/react";
import TeamCostSummaryTable from "./TeamCostSummaryTable";

vi.mock("../../formatters", () => ({
  formatCurrencyFull: (v: number) => `$${v}`,
  formatCount: (v: number) => `${v}`,
  formatCurrencyPrecise: (v: number) => `$${v.toFixed(2)}`,
}));

vi.mock("../../context/DateRangeContext", () => ({
  useDateRange: () => ({ start: "2026-02-03", end: "2026-03-04" }),
}));

const mockUseTeamCostSummary = vi.fn();
vi.mock("../../hooks/useCostExplorer", () => ({
  useTeamCostSummary: (...args: unknown[]) => mockUseTeamCostSummary(...args),
}));

describe("TeamCostSummaryTable", () => {
  it("shows skeleton while loading", () => {
    mockUseTeamCostSummary.mockReturnValue({ isLoading: true, isError: false });
    const { container } = render(<TeamCostSummaryTable />);
    expect(container.querySelector(".skeleton")).toBeInTheDocument();
  });

  it("renders table headers", () => {
    mockUseTeamCostSummary.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        total_spend_usd: 10000,
        teams: [
          { team_id: "t1", team_name: "Alpha", spend_usd: 6000, run_count: 120, avg_cost_per_run: 50, delta_pct: 5, share_pct: 60 },
        ],
      },
    });
    render(<TeamCostSummaryTable />);
    expect(screen.getByText("Team")).toBeInTheDocument();
    expect(screen.getByText("Spend")).toBeInTheDocument();
    expect(screen.getByText("Runs")).toBeInTheDocument();
    expect(screen.getByText("Avg $/Run")).toBeInTheDocument();
    expect(screen.getByText("vs Prior Period")).toBeInTheDocument();
    expect(screen.getByText("Share")).toBeInTheDocument();
  });

  it("renders team data rows", () => {
    mockUseTeamCostSummary.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        total_spend_usd: 10000,
        teams: [
          { team_id: "t1", team_name: "Alpha", spend_usd: 6000, run_count: 120, avg_cost_per_run: 50, delta_pct: 5, share_pct: 60 },
          { team_id: "t2", team_name: "Beta", spend_usd: 4000, run_count: 100, avg_cost_per_run: 40, delta_pct: -3, share_pct: 40 },
        ],
      },
    });
    render(<TeamCostSummaryTable />);
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
    expect(screen.getByText("$50.00")).toBeInTheDocument();
    expect(screen.getByText("$40.00")).toBeInTheDocument();
    expect(screen.getByText("60%")).toBeInTheDocument();
    expect(screen.getByText("40%")).toBeInTheDocument();
  });

  it("renders delta tags with correct colors", () => {
    mockUseTeamCostSummary.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        total_spend_usd: 10000,
        teams: [
          { team_id: "t1", team_name: "Alpha", spend_usd: 6000, run_count: 120, avg_cost_per_run: 50, delta_pct: 5, share_pct: 60 },
          { team_id: "t2", team_name: "Beta", spend_usd: 3000, run_count: 100, avg_cost_per_run: 30, delta_pct: -3, share_pct: 30 },
          { team_id: "t3", team_name: "Gamma", spend_usd: 1000, run_count: 50, avg_cost_per_run: 20, delta_pct: 0, share_pct: 10 },
        ],
      },
    });
    render(<TeamCostSummaryTable />);
    expect(screen.getByText("+5%")).toHaveClass("tag", "red");
    expect(screen.getByText("-3%")).toHaveClass("tag", "green");
    expect(screen.getByText("0%")).toHaveClass("tag", "gray");
  });

  it("shows empty state when no teams", () => {
    mockUseTeamCostSummary.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { total_spend_usd: 0, teams: [] },
    });
    render(<TeamCostSummaryTable />);
    expect(screen.getByText("No data for selected period")).toBeInTheDocument();
  });
});
