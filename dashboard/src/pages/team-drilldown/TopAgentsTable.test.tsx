import { render, screen } from "@testing-library/react";
import TopAgentsTable from "./TopAgentsTable";

vi.mock("../../formatters", () => ({
  formatCount: (v: number) => `${v}`,
  formatPercent: (v: number) => `${v.toFixed(1)}%`,
  formatDuration: (ms: number) => `${(ms / 1000).toFixed(1)}s`,
  formatCurrencyFull: (v: number) => `$${v}`,
}));

vi.mock("../../context/DateRangeContext", () => ({
  useDateRange: () => ({ start: "2026-02-03", end: "2026-03-04" }),
}));

const mockUseTeamTopAgents = vi.fn();
vi.mock("../../hooks/useTeamDrillDown", () => ({
  useTeamTopAgents: (...args: unknown[]) => mockUseTeamTopAgents(...args),
}));

describe("TopAgentsTable", () => {
  it("shows skeleton while loading", () => {
    mockUseTeamTopAgents.mockReturnValue({ isLoading: true, isError: false });
    const { container } = render(<TopAgentsTable teamId="t1" />);
    expect(container.querySelector(".skeleton")).toBeInTheDocument();
  });

  it("renders title and table headers", () => {
    mockUseTeamTopAgents.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        agents: [
          {
            agent_type: "code-reviewer",
            run_count: 500,
            success_rate_pct: 98.0,
            avg_duration_ms: 3200,
            spend_usd: 1250,
          },
        ],
      },
    });
    render(<TopAgentsTable teamId="t1" />);
    expect(screen.getByText("Top Agents")).toBeInTheDocument();
    expect(screen.getByText("Agent Type")).toBeInTheDocument();
    expect(screen.getByText("Avg Duration")).toBeInTheDocument();
  });

  it("renders agent data", () => {
    mockUseTeamTopAgents.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        agents: [
          {
            agent_type: "code-reviewer",
            run_count: 500,
            success_rate_pct: 98.0,
            avg_duration_ms: 3200,
            spend_usd: 1250,
          },
        ],
      },
    });
    render(<TopAgentsTable teamId="t1" />);
    expect(screen.getByText("code-reviewer")).toBeInTheDocument();
    expect(screen.getByText("500")).toBeInTheDocument();
    expect(screen.getByText("3.2s")).toBeInTheDocument();
    expect(screen.getByText("$1250")).toBeInTheDocument();
  });

  it("shows empty state when no data", () => {
    mockUseTeamTopAgents.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { agents: [] },
    });
    render(<TopAgentsTable teamId="t1" />);
    expect(screen.getByText("No data for selected period")).toBeInTheDocument();
  });
});
