import { render, screen } from "@testing-library/react";
import MonthlySpendChart from "./MonthlySpendChart";

vi.mock("../../formatters", () => ({
  formatCurrencyCompact: (v: number) => `$${v}`,
  formatCurrencyFull: (v: number) => `$${v}`,
}));

const mockUseMonthlySpend = vi.fn();
vi.mock("../../hooks/useExecutiveSummary", () => ({
  useMonthlySpend: () => mockUseMonthlySpend(),
}));

// Recharts uses ResizeObserver internally
vi.stubGlobal("ResizeObserver", class {
  observe() {}
  unobserve() {}
  disconnect() {}
});

describe("MonthlySpendChart", () => {
  it("shows skeleton while loading", () => {
    mockUseMonthlySpend.mockReturnValue({ isLoading: true, isError: false });
    const { container } = render(<MonthlySpendChart />);
    expect(container.querySelector(".skeleton")).toBeInTheDocument();
  });

  it("renders title and legend", () => {
    mockUseMonthlySpend.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        monthly_spend: [{ period: "2026-01", total_usd: 40000 }],
        monthly_spend_forecast: [{ period: "2026-04", projected_usd: 45000 }],
      },
    });
    render(<MonthlySpendChart />);
    expect(screen.getByText("Monthly Spend + 3 Month Forecast")).toBeInTheDocument();
    expect(screen.getByText("Actual")).toBeInTheDocument();
    expect(screen.getByText("Forecast")).toBeInTheDocument();
  });

  it("shows empty state when no data", () => {
    mockUseMonthlySpend.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { monthly_spend: [], monthly_spend_forecast: [] },
    });
    render(<MonthlySpendChart />);
    expect(screen.getByText("No data for selected period")).toBeInTheDocument();
  });
});
