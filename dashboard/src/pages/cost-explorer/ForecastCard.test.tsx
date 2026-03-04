import { render, screen } from "@testing-library/react";
import ForecastCard from "./ForecastCard";

vi.mock("../../formatters", () => ({
  formatCurrencyFull: (v: number) => `$${v}`,
  formatCurrencyCompact: (v: number) => `$${v}`,
}));

const mockUseBudgetForecast = vi.fn();
vi.mock("../../hooks/useExecutiveSummary", () => ({
  useBudgetForecast: () => mockUseBudgetForecast(),
}));

describe("ForecastCard", () => {
  it("shows skeleton while loading", () => {
    mockUseBudgetForecast.mockReturnValue({ isLoading: true, isError: false });
    const { container } = render(<ForecastCard />);
    expect(container.querySelector(".skeleton")).toBeInTheDocument();
  });

  it("renders projected spend and budget info", () => {
    mockUseBudgetForecast.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        forecast: { projected_usd: 51800, projected_over_budget_usd: 6800, projected_budget_pct: 115 },
        burn_rate: { budget_usd: 45000, burn_pct: 73, month_progress_pct: 58, on_track: false },
      },
    });
    render(<ForecastCard />);
    expect(screen.getByText("Forecasted Month-End Spend")).toBeInTheDocument();
    expect(screen.getByText("$51800")).toBeInTheDocument();
    expect(screen.getByText("Budget: $45000")).toBeInTheDocument();
    expect(screen.getByText("115% of budget — $6800 over")).toBeInTheDocument();
  });

  it("shows under budget label when projected under", () => {
    mockUseBudgetForecast.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        forecast: { projected_usd: 40000, projected_over_budget_usd: -5000, projected_budget_pct: 89 },
        burn_rate: { budget_usd: 45000, burn_pct: 50, month_progress_pct: 58, on_track: true },
      },
    });
    render(<ForecastCard />);
    expect(screen.getByText("89% of budget — $5000 under")).toBeInTheDocument();
  });

  it("hides budget context when no budget configured", () => {
    mockUseBudgetForecast.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        forecast: { projected_usd: 40000, projected_over_budget_usd: null, projected_budget_pct: null },
        burn_rate: { budget_usd: null, burn_pct: null, month_progress_pct: 58, on_track: true },
      },
    });
    render(<ForecastCard />);
    expect(screen.getByText("$40000")).toBeInTheDocument();
    expect(screen.queryByText(/Budget:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/of budget/)).not.toBeInTheDocument();
  });

  it("applies gradient fill when over budget", () => {
    mockUseBudgetForecast.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        forecast: { projected_usd: 55000, projected_over_budget_usd: 10000, projected_budget_pct: 122 },
        burn_rate: { budget_usd: 45000, burn_pct: 80, month_progress_pct: 60, on_track: false },
      },
    });
    const { container } = render(<ForecastCard />);
    const fill = container.querySelector(".progress-fill") as HTMLElement;
    expect(fill.style.background).toContain("linear-gradient");
    expect(fill.style.width).toBe("120%");
  });
});
