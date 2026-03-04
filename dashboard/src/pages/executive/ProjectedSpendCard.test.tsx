import { render, screen } from "@testing-library/react";
import ProjectedSpendCard from "./ProjectedSpendCard";

vi.mock("../../formatters", () => ({
  formatCurrencyCompact: (v: number) => `$${v}`,
}));

const mockUseBudgetForecast = vi.fn();
vi.mock("../../hooks/useExecutiveSummary", () => ({
  useBudgetForecast: () => mockUseBudgetForecast(),
}));

describe("ProjectedSpendCard", () => {
  it("shows skeleton while loading", () => {
    mockUseBudgetForecast.mockReturnValue({ isLoading: true, isError: false });
    const { container } = render(<ProjectedSpendCard />);
    expect(container.querySelector(".skeleton")).toBeInTheDocument();
  });

  it("renders projected spend", () => {
    mockUseBudgetForecast.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { forecast: { projected_usd: 52000, projected_over_budget_usd: null } },
    });
    render(<ProjectedSpendCard />);
    expect(screen.getByText("Projected Month-End")).toBeInTheDocument();
    expect(screen.getByText("$52000")).toBeInTheDocument();
  });

  it("shows over budget with down class", () => {
    mockUseBudgetForecast.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { forecast: { projected_usd: 55000, projected_over_budget_usd: 5000 } },
    });
    render(<ProjectedSpendCard />);
    expect(screen.getByText("$5000 over budget")).toHaveClass("kpi-delta", "down");
  });

  it("shows under budget with up class", () => {
    mockUseBudgetForecast.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { forecast: { projected_usd: 45000, projected_over_budget_usd: -3000 } },
    });
    render(<ProjectedSpendCard />);
    expect(screen.getByText("$3000 under budget")).toHaveClass("kpi-delta", "up");
  });

  it("hides delta when over_budget is null", () => {
    mockUseBudgetForecast.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { forecast: { projected_usd: 48000, projected_over_budget_usd: null } },
    });
    render(<ProjectedSpendCard />);
    expect(screen.queryByText(/budget/)).not.toBeInTheDocument();
  });
});
