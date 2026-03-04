import { render, screen } from "@testing-library/react";
import TotalRunsKpiCard from "./TotalRunsKpiCard";

vi.mock("../../formatters", () => ({
  formatCount: (v: number) => `${v}`,
  formatSignedPercent: (v: number) => `${v > 0 ? "+" : ""}${v.toFixed(1)}%`,
  getDeltaClass: (value: number, type: string) => {
    if (value === 0) return "";
    return (type === "cost" ? value < 0 : value > 0) ? "up" : "down";
  },
}));

vi.mock("../../context/DateRangeContext", () => ({
  useDateRange: () => ({ start: "2026-02-03", end: "2026-03-04" }),
}));

const mockUseRunVolume = vi.fn();
vi.mock("../../hooks/useExecutiveSummary", () => ({
  useRunVolume: (...args: unknown[]) => mockUseRunVolume(...args),
}));

describe("TotalRunsKpiCard", () => {
  it("shows skeleton while loading", () => {
    mockUseRunVolume.mockReturnValue({ isLoading: true, isError: false });
    const { container } = render(<TotalRunsKpiCard />);
    expect(container.querySelector(".skeleton")).toBeInTheDocument();
  });

  it("renders run count and delta", () => {
    mockUseRunVolume.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { total_runs: 500, delta_pct: 12.5, daily: [] },
    });
    render(<TotalRunsKpiCard />);
    expect(screen.getByText("Total Runs (30d)")).toBeInTheDocument();
    expect(screen.getByText("500")).toBeInTheDocument();
    expect(screen.getByText("+12.5% vs prior period")).toBeInTheDocument();
  });

  it("applies up class for increased runs", () => {
    mockUseRunVolume.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { total_runs: 500, delta_pct: 10, daily: [] },
    });
    render(<TotalRunsKpiCard />);
    expect(screen.getByText("+10.0% vs prior period")).toHaveClass("kpi-delta", "up");
  });

  it("applies down class for decreased runs", () => {
    mockUseRunVolume.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { total_runs: 300, delta_pct: -4.1, daily: [] },
    });
    render(<TotalRunsKpiCard />);
    expect(screen.getByText("-4.1% vs prior period")).toHaveClass("kpi-delta", "down");
  });
});
