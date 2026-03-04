import { render, screen } from "@testing-library/react";
import LatencyDistributionChart from "./LatencyDistributionChart";

vi.mock("../../context/DateRangeContext", () => ({
  useDateRange: () => ({ start: "2026-02-03", end: "2026-03-04" }),
}));

const mockUseLatencyDistribution = vi.fn();
vi.mock("../../hooks/usePerformance", () => ({
  useLatencyDistribution: (...args: unknown[]) =>
    mockUseLatencyDistribution(...args),
}));

describe("LatencyDistributionChart", () => {
  it("shows skeleton while loading", () => {
    mockUseLatencyDistribution.mockReturnValue({
      isLoading: true,
      isError: false,
    });
    const { container } = render(<LatencyDistributionChart />);
    expect(container.querySelector(".skeleton")).toBeInTheDocument();
  });

  it("renders card title and legend", () => {
    mockUseLatencyDistribution.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        daily: [
          { date: "2026-02-03", p50_ms: 800, p95_ms: 3000, p99_ms: 8000 },
        ],
      },
    });
    render(<LatencyDistributionChart />);
    expect(
      screen.getByText("Latency Distribution (p50 / p95 / p99)"),
    ).toBeInTheDocument();
    expect(screen.getByText("p50")).toBeInTheDocument();
    expect(screen.getByText("p95")).toBeInTheDocument();
    expect(screen.getByText("p99")).toBeInTheDocument();
  });

  it("renders bar columns for each day", () => {
    mockUseLatencyDistribution.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        daily: [
          { date: "2026-02-03", p50_ms: 800, p95_ms: 3000, p99_ms: 8000 },
          { date: "2026-02-04", p50_ms: 900, p95_ms: 3200, p99_ms: 8500 },
        ],
      },
    });
    const { container } = render(<LatencyDistributionChart />);
    expect(container.querySelectorAll(".latency-bar-col")).toHaveLength(2);
  });

  it("shows empty state when no data", () => {
    mockUseLatencyDistribution.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { daily: [] },
    });
    render(<LatencyDistributionChart />);
    expect(
      screen.getByText("No data for selected period"),
    ).toBeInTheDocument();
  });
});
