import { render, screen } from "@testing-library/react";
import BurnRateCard from "./BurnRateCard";

const mockUseBudgetForecast = vi.fn();
vi.mock("../../hooks/useExecutiveSummary", () => ({
  useBudgetForecast: () => mockUseBudgetForecast(),
}));

describe("BurnRateCard", () => {
  it("shows skeleton while loading", () => {
    mockUseBudgetForecast.mockReturnValue({ isLoading: true, isError: false });
    const { container } = render(<BurnRateCard />);
    expect(container.querySelector(".skeleton")).toBeInTheDocument();
  });

  it("renders burn rate and context", () => {
    mockUseBudgetForecast.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        days_elapsed: 18,
        days_in_month: 31,
        forecast: { projected_usd: 50000, projected_over_budget_usd: 5000, projected_budget_pct: 111 },
        burn_rate: { budget_usd: 45000, burn_pct: 73.2, month_progress_pct: 58, on_track: true },
      },
    });
    render(<BurnRateCard />);
    expect(screen.getByText("Budget Burn Rate")).toBeInTheDocument();
    expect(screen.getByText("73%")).toBeInTheDocument();
    expect(screen.getByText("of monthly budget consumed")).toBeInTheDocument();
    expect(screen.getByText("Day 18 of 31 (58% through month)")).toBeInTheDocument();
  });

  it("colors value green when on track", () => {
    mockUseBudgetForecast.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        days_elapsed: 15,
        days_in_month: 31,
        forecast: { projected_usd: 40000, projected_over_budget_usd: -5000, projected_budget_pct: 89 },
        burn_rate: { budget_usd: 45000, burn_pct: 45, month_progress_pct: 48, on_track: true },
      },
    });
    render(<BurnRateCard />);
    const value = screen.getByText("45%");
    expect(value.style.color).toBe("var(--green)");
  });

  it("colors value red when not on track", () => {
    mockUseBudgetForecast.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        days_elapsed: 10,
        days_in_month: 31,
        forecast: { projected_usd: 60000, projected_over_budget_usd: 15000, projected_budget_pct: 133 },
        burn_rate: { budget_usd: 45000, burn_pct: 80, month_progress_pct: 32, on_track: false },
      },
    });
    render(<BurnRateCard />);
    const value = screen.getByText("80%");
    expect(value.style.color).toBe("var(--red)");
  });

  it("shows 'No budget configured' when budget is null", () => {
    mockUseBudgetForecast.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        days_elapsed: 10,
        days_in_month: 31,
        forecast: { projected_usd: 40000, projected_over_budget_usd: null, projected_budget_pct: null },
        burn_rate: { budget_usd: null, burn_pct: null, month_progress_pct: 32, on_track: true },
      },
    });
    render(<BurnRateCard />);
    expect(screen.getByText("No budget configured")).toBeInTheDocument();
    expect(screen.queryByText(/%$/)).not.toBeInTheDocument();
  });
});
