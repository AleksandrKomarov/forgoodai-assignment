import { render, screen } from "@testing-library/react";
import RunHeatmap from "./RunHeatmap";

vi.mock("../../dateUtils", () => ({
  daysBetween: (a: string, b: string) =>
    Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000) + 1,
}));

const mockUseDateRange = vi.fn().mockReturnValue({ start: "2026-02-03", end: "2026-03-04" });
vi.mock("../../context/DateRangeContext", () => ({
  useDateRange: () => mockUseDateRange(),
}));

const mockUseRunHeatmap = vi.fn();
vi.mock("../../hooks/useUsageCapacity", () => ({
  useRunHeatmap: (...args: unknown[]) => mockUseRunHeatmap(...args),
}));

describe("RunHeatmap", () => {
  it("shows skeleton while loading", () => {
    mockUseRunHeatmap.mockReturnValue({ isLoading: true, isError: false });
    const { container } = render(<RunHeatmap />);
    expect(container.querySelector(".skeleton")).toBeInTheDocument();
  });

  it("renders title and heatmap cells", () => {
    mockUseRunHeatmap.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        cells: [
          { day_of_week: 0, hour_of_day: 9, run_count: 50 },
          { day_of_week: 1, hour_of_day: 10, run_count: 120 },
        ],
      },
    });
    const { container } = render(<RunHeatmap />);
    expect(screen.getByText("Run Heatmap (Day × Hour)")).toBeInTheDocument();
    expect(container.querySelectorAll(".heatmap-cell").length).toBeGreaterThan(0);
  });

  it("renders day labels", () => {
    mockUseRunHeatmap.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        cells: [{ day_of_week: 0, hour_of_day: 0, run_count: 10 }],
      },
    });
    render(<RunHeatmap />);
    expect(screen.getByText("Mon")).toBeInTheDocument();
    expect(screen.getByText("Fri")).toBeInTheDocument();
  });

  it("shows 90-day warning when range exceeds 90 days", () => {
    mockUseDateRange.mockReturnValue({ start: "2025-01-01", end: "2025-12-31" });
    mockUseRunHeatmap.mockReturnValue({ isLoading: false, isError: false });
    render(<RunHeatmap />);
    expect(screen.getByText("Heatmap data is limited to 90-day ranges.")).toBeInTheDocument();
    mockUseDateRange.mockReturnValue({ start: "2026-02-03", end: "2026-03-04" });
  });
});
