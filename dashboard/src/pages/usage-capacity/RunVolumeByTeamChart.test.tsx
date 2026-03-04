import { render, screen } from "@testing-library/react";
import RunVolumeByTeamChart from "./RunVolumeByTeamChart";

vi.mock("../../formatters", () => ({
  formatCount: (v: number) => `${v}`,
}));

vi.mock("../../context/DateRangeContext", () => ({
  useDateRange: () => ({ start: "2026-02-03", end: "2026-03-04" }),
}));

const mockUseRunVolumeByTeam = vi.fn();
vi.mock("../../hooks/useUsageCapacity", () => ({
  useRunVolumeByTeam: (...args: unknown[]) => mockUseRunVolumeByTeam(...args),
}));

describe("RunVolumeByTeamChart", () => {
  it("shows skeleton while loading", () => {
    mockUseRunVolumeByTeam.mockReturnValue({ isLoading: true, isError: false });
    const { container } = render(<RunVolumeByTeamChart />);
    expect(container.querySelector(".skeleton")).toBeInTheDocument();
  });

  it("renders title and team rows", () => {
    mockUseRunVolumeByTeam.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        teams: [
          { team_id: "t1", team_name: "ML Infra", run_count: 4000 },
          { team_id: "t2", team_name: "Data Eng", run_count: 2500 },
        ],
      },
    });
    render(<RunVolumeByTeamChart />);
    expect(screen.getByText("Run Volume by Team")).toBeInTheDocument();
    expect(screen.getByText("ML Infra")).toBeInTheDocument();
    expect(screen.getByText("Data Eng")).toBeInTheDocument();
    expect(screen.getByText("4000")).toBeInTheDocument();
  });

  it("shows empty state when no data", () => {
    mockUseRunVolumeByTeam.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { teams: [] },
    });
    render(<RunVolumeByTeamChart />);
    expect(screen.getByText("No data for selected period")).toBeInTheDocument();
  });
});
