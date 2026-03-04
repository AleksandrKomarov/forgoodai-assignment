import { render, screen } from "@testing-library/react";
import P95LatencyKpiCard from "./P95LatencyKpiCard";

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

describe("P95LatencyKpiCard", () => {
  it("shows skeleton while loading", () => {
    mockUseLatencyKpi.mockReturnValue({ isLoading: true, isError: false });
    const { container } = render(<P95LatencyKpiCard />);
    expect(container.querySelector(".skeleton")).toBeInTheDocument();
  });

  it("renders label and p95 value", () => {
    mockUseLatencyKpi.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { p95_ms: 4800, delta_p95_ms: 320 },
    });
    render(<P95LatencyKpiCard />);
    expect(screen.getByText("P95 Latency")).toBeInTheDocument();
    expect(screen.getByText("4.8s")).toBeInTheDocument();
  });

  it("renders delta", () => {
    mockUseLatencyKpi.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { p95_ms: 4800, delta_p95_ms: 320 },
    });
    render(<P95LatencyKpiCard />);
    expect(screen.getByText("+320ms")).toBeInTheDocument();
  });

  it("shows 90-day warning when range exceeds 90 days", () => {
    mockUseDateRange.mockReturnValue({ start: "2025-01-01", end: "2025-12-31" });
    mockUseLatencyKpi.mockReturnValue({ isLoading: false, isError: false });
    render(<P95LatencyKpiCard />);
    expect(screen.getByText("Latency data is limited to 90-day ranges.")).toBeInTheDocument();
    mockUseDateRange.mockReturnValue({ start: "2026-02-03", end: "2026-03-04" });
  });
});
