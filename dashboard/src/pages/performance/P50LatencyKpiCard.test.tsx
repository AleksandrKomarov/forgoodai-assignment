import { render, screen } from "@testing-library/react";
import P50LatencyKpiCard from "./P50LatencyKpiCard";

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

describe("P50LatencyKpiCard", () => {
  it("shows skeleton while loading", () => {
    mockUseLatencyKpi.mockReturnValue({ isLoading: true, isError: false });
    const { container } = render(<P50LatencyKpiCard />);
    expect(container.querySelector(".skeleton")).toBeInTheDocument();
  });

  it("renders label and value", () => {
    mockUseLatencyKpi.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { p50_ms: 1200, delta_p50_ms: -80 },
    });
    render(<P50LatencyKpiCard />);
    expect(screen.getByText("P50 Latency")).toBeInTheDocument();
    expect(screen.getByText("1.2s")).toBeInTheDocument();
  });

  it("renders negative delta with up class (lower is good)", () => {
    mockUseLatencyKpi.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { p50_ms: 1200, delta_p50_ms: -80 },
    });
    render(<P50LatencyKpiCard />);
    const delta = screen.getByText("-80ms");
    expect(delta.className).toContain("up");
  });

  it("renders positive delta with down class", () => {
    mockUseLatencyKpi.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { p50_ms: 1500, delta_p50_ms: 300 },
    });
    render(<P50LatencyKpiCard />);
    const delta = screen.getByText("+300ms");
    expect(delta.className).toContain("down");
  });

  it("shows 90-day warning when range exceeds 90 days", () => {
    mockUseDateRange.mockReturnValue({ start: "2025-01-01", end: "2025-12-31" });
    mockUseLatencyKpi.mockReturnValue({ isLoading: false, isError: false });
    render(<P50LatencyKpiCard />);
    expect(screen.getByText("Latency data is limited to 90-day ranges.")).toBeInTheDocument();
    mockUseDateRange.mockReturnValue({ start: "2026-02-03", end: "2026-03-04" });
  });
});
