import { render, screen } from "@testing-library/react";
import RunVolumeSparkline from "./RunVolumeSparkline";

vi.mock("../../formatters", () => ({
  formatCount: (v: number) => `${v}`,
}));

vi.mock("../../context/DateRangeContext", () => ({
  useDateRange: () => ({ start: "2026-02-03", end: "2026-03-04" }),
}));

const mockUseRunVolume = vi.fn();
vi.mock("../../hooks/useExecutiveSummary", () => ({
  useRunVolume: (...args: unknown[]) => mockUseRunVolume(...args),
}));

describe("RunVolumeSparkline", () => {
  it("shows skeleton while loading", () => {
    mockUseRunVolume.mockReturnValue({ isLoading: true, isError: false });
    const { container } = render(<RunVolumeSparkline />);
    expect(container.querySelector(".skeleton")).toBeInTheDocument();
  });

  it("renders title with day count", () => {
    mockUseRunVolume.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { total_runs: 300, delta_pct: 5, daily: [{ date: "2026-03-04", count: 10 }] },
    });
    render(<RunVolumeSparkline />);
    expect(screen.getByText("Run Volume (30d)")).toBeInTheDocument();
  });

  it("renders sparkline bars with title attributes", () => {
    mockUseRunVolume.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        total_runs: 30,
        delta_pct: 0,
        daily: [
          { date: "2026-03-03", count: 12 },
          { date: "2026-03-04", count: 18 },
        ],
      },
    });
    const { container } = render(<RunVolumeSparkline />);
    const bars = container.querySelectorAll(".sp-bar");
    expect(bars).toHaveLength(2);
    expect(bars[0]!.getAttribute("title")).toBe("2026-03-03: 12 runs");
    expect(bars[1]!.getAttribute("title")).toBe("2026-03-04: 18 runs");
  });

  it("shows empty state when daily is empty", () => {
    mockUseRunVolume.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { total_runs: 0, delta_pct: 0, daily: [] },
    });
    render(<RunVolumeSparkline />);
    expect(screen.getByText("No data for selected period")).toBeInTheDocument();
  });
});
