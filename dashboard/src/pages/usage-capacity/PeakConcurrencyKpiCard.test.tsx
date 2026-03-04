import { render, screen } from "@testing-library/react";
import PeakConcurrencyKpiCard from "./PeakConcurrencyKpiCard";

vi.mock("../../formatters", () => ({
  formatCount: (v: number) => `${v}`,
}));

vi.mock("../../dateUtils", () => ({
  daysBetween: (a: string, b: string) =>
    Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000) + 1,
}));

const mockUseDateRange = vi.fn().mockReturnValue({ start: "2026-02-03", end: "2026-03-04" });
vi.mock("../../context/DateRangeContext", () => ({
  useDateRange: () => mockUseDateRange(),
}));

const mockUseConcurrencyTimeseries = vi.fn();
vi.mock("../../hooks/useUsageCapacity", () => ({
  useConcurrencyTimeseries: (...args: unknown[]) => mockUseConcurrencyTimeseries(...args),
}));

describe("PeakConcurrencyKpiCard", () => {
  it("shows skeleton while loading", () => {
    mockUseConcurrencyTimeseries.mockReturnValue({ isLoading: true, isError: false });
    const { container } = render(<PeakConcurrencyKpiCard />);
    expect(container.querySelector(".skeleton")).toBeInTheDocument();
  });

  it("renders peak value and limit subtitle", () => {
    mockUseConcurrencyTimeseries.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { peak_in_period: 38, concurrency_limit: 40 },
    });
    render(<PeakConcurrencyKpiCard />);
    expect(screen.getByText("38")).toBeInTheDocument();
    expect(screen.getByText("Limit: 40")).toBeInTheDocument();
  });

  it("renders 'No limit set' when no limit", () => {
    mockUseConcurrencyTimeseries.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { peak_in_period: 25, concurrency_limit: null },
    });
    render(<PeakConcurrencyKpiCard />);
    expect(screen.getByText("No limit set")).toBeInTheDocument();
  });

  it("shows 90-day warning when range exceeds 90 days", () => {
    mockUseDateRange.mockReturnValue({ start: "2025-01-01", end: "2025-12-31" });
    mockUseConcurrencyTimeseries.mockReturnValue({ isLoading: false, isError: false });
    render(<PeakConcurrencyKpiCard />);
    expect(screen.getByText("Concurrency data is limited to 90-day ranges.")).toBeInTheDocument();
    mockUseDateRange.mockReturnValue({ start: "2026-02-03", end: "2026-03-04" });
  });
});
