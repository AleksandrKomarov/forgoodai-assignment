import { render, screen } from "@testing-library/react";
import SpendBreakdownDonut from "./SpendBreakdownDonut";

vi.mock("../../formatters", () => ({
  formatCurrencyCompact: (v: number) => `$${v}`,
}));

vi.mock("../../context/DateRangeContext", () => ({
  useDateRange: () => ({ start: "2026-02-03", end: "2026-03-04" }),
}));

const mockUseSpendBreakdown = vi.fn();
vi.mock("../../hooks/useCostExplorer", () => ({
  useSpendBreakdown: (...args: unknown[]) => mockUseSpendBreakdown(...args),
}));

describe("SpendBreakdownDonut", () => {
  it("shows skeleton while loading", () => {
    mockUseSpendBreakdown.mockReturnValue({ isLoading: true, isError: false });
    const { container } = render(<SpendBreakdownDonut />);
    expect(container.querySelector(".skeleton")).toBeInTheDocument();
  });

  it("renders card title", () => {
    mockUseSpendBreakdown.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        total_usd: 50000,
        drivers: [
          { driver: "tokens", spend_usd: 25000, pct: 50 },
          { driver: "compute", spend_usd: 15000, pct: 30 },
          { driver: "storage", spend_usd: 10000, pct: 20 },
        ],
      },
    });
    render(<SpendBreakdownDonut />);
    expect(screen.getByText("Spend Breakdown by Cost Driver")).toBeInTheDocument();
  });

  it("renders total in center of donut", () => {
    mockUseSpendBreakdown.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        total_usd: 50000,
        drivers: [{ driver: "tokens", spend_usd: 50000, pct: 100 }],
      },
    });
    render(<SpendBreakdownDonut />);
    expect(screen.getByText("$50000")).toBeInTheDocument();
    expect(screen.getByText("total spend")).toBeInTheDocument();
  });

  it("renders legend rows for each driver", () => {
    mockUseSpendBreakdown.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        total_usd: 10000,
        drivers: [
          { driver: "tokens", spend_usd: 5000, pct: 50 },
          { driver: "compute", spend_usd: 3000, pct: 30 },
          { driver: "storage", spend_usd: 2000, pct: 20 },
        ],
      },
    });
    render(<SpendBreakdownDonut />);
    expect(screen.getByText("tokens — 50% ($5000)")).toBeInTheDocument();
    expect(screen.getByText("compute — 30% ($3000)")).toBeInTheDocument();
    expect(screen.getByText("storage — 20% ($2000)")).toBeInTheDocument();
  });

  it("renders SVG circles for each driver", () => {
    mockUseSpendBreakdown.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        total_usd: 10000,
        drivers: [
          { driver: "tokens", spend_usd: 5000, pct: 50 },
          { driver: "compute", spend_usd: 5000, pct: 50 },
        ],
      },
    });
    const { container } = render(<SpendBreakdownDonut />);
    const circles = container.querySelectorAll("circle");
    expect(circles).toHaveLength(2);
  });

  it("shows empty state when no drivers", () => {
    mockUseSpendBreakdown.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { total_usd: 0, drivers: [] },
    });
    render(<SpendBreakdownDonut />);
    expect(screen.getByText("No data for selected period")).toBeInTheDocument();
  });
});
