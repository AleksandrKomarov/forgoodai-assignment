import { render, screen } from "@testing-library/react";
import FailureHotspotsMatrix from "./FailureHotspotsMatrix";

vi.mock("../../context/DateRangeContext", () => ({
  useDateRange: () => ({ start: "2026-02-03", end: "2026-03-04" }),
}));

const mockUseFailureHotspots = vi.fn();
vi.mock("../../hooks/usePerformance", () => ({
  useFailureHotspots: (...args: unknown[]) =>
    mockUseFailureHotspots(...args),
}));

describe("FailureHotspotsMatrix", () => {
  it("shows skeleton while loading", () => {
    mockUseFailureHotspots.mockReturnValue({ isLoading: true, isError: false });
    const { container } = render(<FailureHotspotsMatrix />);
    expect(container.querySelector(".skeleton")).toBeInTheDocument();
  });

  it("renders card title and team headers", () => {
    mockUseFailureHotspots.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        teams: [
          { team_id: "t1", team_name: "ML Infra" },
          { team_id: "t2", team_name: "Data Eng" },
        ],
        cells: [
          { agent_type: "code-reviewer", team_id: "t1", failure_rate_pct: 1.2, failed: 12, total: 1000 },
          { agent_type: "code-reviewer", team_id: "t2", failure_rate_pct: 0.8, failed: 8, total: 1000 },
        ],
      },
    });
    render(<FailureHotspotsMatrix />);
    expect(
      screen.getByText("Failure Hotspots: Agent Type x Team"),
    ).toBeInTheDocument();
    expect(screen.getByText("ML Infra")).toBeInTheDocument();
    expect(screen.getByText("Data Eng")).toBeInTheDocument();
  });

  it("renders agent type rows with colored tags", () => {
    mockUseFailureHotspots.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        teams: [
          { team_id: "t1", team_name: "ML Infra" },
          { team_id: "t2", team_name: "Data Eng" },
        ],
        cells: [
          { agent_type: "code-reviewer", team_id: "t1", failure_rate_pct: 1.2, failed: 12, total: 1000 },
          { agent_type: "code-reviewer", team_id: "t2", failure_rate_pct: 8.4, failed: 84, total: 1000 },
          { agent_type: "deep-analyzer", team_id: "t1", failure_rate_pct: 3.0, failed: 30, total: 1000 },
          { agent_type: "deep-analyzer", team_id: "t2", failure_rate_pct: 0.5, failed: 5, total: 1000 },
        ],
      },
    });
    render(<FailureHotspotsMatrix />);
    expect(screen.getByText("code-reviewer")).toBeInTheDocument();
    expect(screen.getByText("deep-analyzer")).toBeInTheDocument();

    // <2% = green
    expect(screen.getByText("1.2%").className).toContain("green");
    // >=5% = red
    expect(screen.getByText("8.4%").className).toContain("red");
    // 2-5% = gray
    expect(screen.getByText("3.0%").className).toContain("gray");
    // <2% = green
    expect(screen.getByText("0.5%").className).toContain("green");
  });

  it("shows empty state when no cells", () => {
    mockUseFailureHotspots.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { teams: [], cells: [] },
    });
    render(<FailureHotspotsMatrix />);
    expect(
      screen.getByText("No data for selected period"),
    ).toBeInTheDocument();
  });
});
