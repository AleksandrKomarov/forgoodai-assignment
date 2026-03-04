import { render, screen } from "@testing-library/react";
import P99LatencyKpiCard from "./P99LatencyKpiCard";

vi.mock("../../formatters", () => ({
  formatDuration: (ms: number) => `${(ms / 1000).toFixed(1)}s`,
  formatLatencyDelta: (ms: number) => `${ms > 0 ? "+" : ""}${ms}ms`,
  getLatencyDeltaClass: (ms: number) => (ms === 0 ? "" : ms < 0 ? "up" : "down"),
}));

vi.mock("../../dateUtils", () => ({
  daysBetween: (a: string, b: string) =>
    Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000) + 1,
}));

const mockUseDateRange = vi.fn().mockReturnValue({ start: "2026-02-03", end: "2026-03-04" });
vi.mock("../../context/DateRangeContext", () => ({
  useDateRange: () => mockUseDateRange(),
}));

const mockUseLatencyKpi = vi.fn();
vi.mock("../../hooks/usePerformance", () => ({
  useLatencyKpi: (...args: unknown[]) => mockUseLatencyKpi(...args),
}));

describe("P99LatencyKpiCard", () => {
  it("shows skeleton while loading", () => {
    mockUseLatencyKpi.mockReturnValue({ isLoading: true, isError: false });
    const { container } = render(<P99LatencyKpiCard />);
    expect(container.querySelector(".skeleton")).toBeInTheDocument();
  });

  it("renders label and p99 value", () => {
    mockUseLatencyKpi.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { p99_ms: 12100, delta_p99_ms: 1400 },
    });
    render(<P99LatencyKpiCard />);
    expect(screen.getByText("P99 Latency")).toBeInTheDocument();
    expect(screen.getByText("12.1s")).toBeInTheDocument();
  });

  it("renders delta", () => {
    mockUseLatencyKpi.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { p99_ms: 12100, delta_p99_ms: 1400 },
    });
    render(<P99LatencyKpiCard />);
    expect(screen.getByText("+1400ms")).toBeInTheDocument();
  });

  it("shows 90-day warning when range exceeds 90 days", () => {
    mockUseDateRange.mockReturnValue({ start: "2025-01-01", end: "2025-12-31" });
    mockUseLatencyKpi.mockReturnValue({ isLoading: false, isError: false });
    render(<P99LatencyKpiCard />);
    expect(screen.getByText("Latency data is limited to 90-day ranges.")).toBeInTheDocument();
    mockUseDateRange.mockReturnValue({ start: "2026-02-03", end: "2026-03-04" });
  });
});
