import { render, screen } from "@testing-library/react";
import SlowestAgentsTable from "./SlowestAgentsTable";

vi.mock("../../formatters", () => ({
  formatDuration: (ms: number) => `${(ms / 1000).toFixed(1)}s`,
  formatCount: (v: number) => `${v}`,
}));

vi.mock("../../context/DateRangeContext", () => ({
  useDateRange: () => ({ start: "2026-02-03", end: "2026-03-04" }),
}));

const mockUseSlowestAgents = vi.fn();
vi.mock("../../hooks/usePerformance", () => ({
  useSlowestAgents: (...args: unknown[]) => mockUseSlowestAgents(...args),
}));

describe("SlowestAgentsTable", () => {
  it("shows skeleton while loading", () => {
    mockUseSlowestAgents.mockReturnValue({ isLoading: true, isError: false });
    const { container } = render(<SlowestAgentsTable />);
    expect(container.querySelector(".skeleton")).toBeInTheDocument();
  });

  it("renders card title and table headers", () => {
    mockUseSlowestAgents.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        agents: [
          { agent_type: "deep-analyzer", avg_duration_ms: 18400, p95_duration_ms: 25000, run_count: 312 },
        ],
      },
    });
    render(<SlowestAgentsTable />);
    expect(
      screen.getByText("Slowest Agents (Top 10 by Avg Duration)"),
    ).toBeInTheDocument();
    expect(screen.getByText("Agent")).toBeInTheDocument();
    expect(screen.getByText("Avg Duration")).toBeInTheDocument();
    expect(screen.getByText("Runs")).toBeInTheDocument();
  });

  it("renders agent rows", () => {
    mockUseSlowestAgents.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        agents: [
          { agent_type: "deep-analyzer", avg_duration_ms: 18400, p95_duration_ms: 25000, run_count: 312 },
          { agent_type: "code-reviewer", avg_duration_ms: 12100, p95_duration_ms: 18000, run_count: 1847 },
        ],
      },
    });
    render(<SlowestAgentsTable />);
    expect(screen.getByText("deep-analyzer")).toBeInTheDocument();
    expect(screen.getByText("18.4s")).toBeInTheDocument();
    expect(screen.getByText("312")).toBeInTheDocument();
    expect(screen.getByText("code-reviewer")).toBeInTheDocument();
  });

  it("shows empty state when no agents", () => {
    mockUseSlowestAgents.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { agents: [] },
    });
    render(<SlowestAgentsTable />);
    expect(
      screen.getByText("No data for selected period"),
    ).toBeInTheDocument();
  });
});
