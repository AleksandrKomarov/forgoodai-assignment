import { render, screen } from "@testing-library/react";
import SpendKpiCard from "./SpendKpiCard";

vi.mock("../../formatters", () => ({
  formatCurrencyCompact: (v: number) => `$${v}`,
  formatSignedPercent: (v: number) => `${v > 0 ? "+" : ""}${v.toFixed(1)}%`,
  getDeltaClass: (value: number, type: string) => {
    if (value === 0) return "";
    return (type === "cost" ? value < 0 : value > 0) ? "up" : "down";
  },
}));

vi.mock("../../context/DateRangeContext", () => ({
  useDateRange: () => ({ start: "2026-02-03", end: "2026-03-04" }),
}));

const mockUseSpendKpi = vi.fn();
vi.mock("../../hooks/useExecutiveSummary", () => ({
  useSpendKpi: (...args: unknown[]) => mockUseSpendKpi(...args),
}));

describe("SpendKpiCard", () => {
  it("shows skeleton while loading", () => {
    mockUseSpendKpi.mockReturnValue({ isLoading: true, isError: false });
    const { container } = render(<SpendKpiCard />);
    expect(container.querySelector(".skeleton")).toBeInTheDocument();
  });

  it("renders spend value and delta", () => {
    mockUseSpendKpi.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { spend_usd: 47200, delta_pct: 8.3 },
    });
    render(<SpendKpiCard />);
    expect(screen.getByText("Accumulated Spend (30d)")).toBeInTheDocument();
    expect(screen.getByText("$47200")).toBeInTheDocument();
    expect(screen.getByText("+8.3% vs prior period")).toBeInTheDocument();
  });

  it("applies down class for cost increase", () => {
    mockUseSpendKpi.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { spend_usd: 50000, delta_pct: 10 },
    });
    render(<SpendKpiCard />);
    expect(screen.getByText("+10.0% vs prior period")).toHaveClass("kpi-delta", "down");
  });

  it("applies up class for cost decrease", () => {
    mockUseSpendKpi.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { spend_usd: 30000, delta_pct: -5.2 },
    });
    render(<SpendKpiCard />);
    expect(screen.getByText("-5.2% vs prior period")).toHaveClass("kpi-delta", "up");
  });
});
