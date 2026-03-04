import { render, screen } from "@testing-library/react";
import ConcurrencyChart from "./ConcurrencyChart";

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

describe("ConcurrencyChart", () => {
  it("shows skeleton while loading", () => {
    mockUseConcurrencyTimeseries.mockReturnValue({ isLoading: true, isError: false });
    const { container } = render(<ConcurrencyChart />);
    expect(container.querySelector(".skeleton")).toBeInTheDocument();
  });

  it("renders title and bars", () => {
    mockUseConcurrencyTimeseries.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        concurrency_limit: 40,
        peak_in_period: 35,
        daily: [
          { date: "2026-02-03", peak_concurrent: 30 },
          { date: "2026-02-04", peak_concurrent: 35 },
        ],
      },
    });
    const { container } = render(<ConcurrencyChart />);
    expect(screen.getByText("Concurrency Over Time")).toBeInTheDocument();
    expect(container.querySelectorAll(".concurrency-bar")).toHaveLength(2);
  });

  it("renders limit line when limit exists", () => {
    mockUseConcurrencyTimeseries.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        concurrency_limit: 40,
        peak_in_period: 35,
        daily: [{ date: "2026-02-03", peak_concurrent: 30 }],
      },
    });
    const { container } = render(<ConcurrencyChart />);
    expect(container.querySelector(".concurrency-limit-line")).toBeInTheDocument();
    expect(screen.getByText("Limit: 40")).toBeInTheDocument();
  });

  it("shows empty state when no data", () => {
    mockUseConcurrencyTimeseries.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { concurrency_limit: null, peak_in_period: 0, daily: [] },
    });
    render(<ConcurrencyChart />);
    expect(screen.getByText("No data for selected period")).toBeInTheDocument();
  });

  it("shows 90-day warning when range exceeds 90 days", () => {
    mockUseDateRange.mockReturnValue({ start: "2025-01-01", end: "2025-12-31" });
    mockUseConcurrencyTimeseries.mockReturnValue({ isLoading: false, isError: false });
    render(<ConcurrencyChart />);
    expect(screen.getByText("Concurrency data is limited to 90-day ranges.")).toBeInTheDocument();
    mockUseDateRange.mockReturnValue({ start: "2026-02-03", end: "2026-03-04" });
  });
});
