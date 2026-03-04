import { render, screen } from "@testing-library/react";
import SuccessRateKpiCard from "./SuccessRateKpiCard";

vi.mock("../../formatters", () => ({
  formatPercent: (v: number) => `${v.toFixed(1)}%`,
}));

vi.mock("../../context/DateRangeContext", () => ({
  useDateRange: () => ({ start: "2026-02-03", end: "2026-03-04" }),
}));

const mockUseSuccessRate = vi.fn();
vi.mock("../../hooks/useExecutiveSummary", () => ({
  useSuccessRate: (...args: unknown[]) => mockUseSuccessRate(...args),
}));

describe("SuccessRateKpiCard", () => {
  it("shows skeleton while loading", () => {
    mockUseSuccessRate.mockReturnValue({ isLoading: true, isError: false });
    const { container } = render(<SuccessRateKpiCard />);
    expect(container.querySelector(".skeleton")).toBeInTheDocument();
  });

  it("renders rate and positive delta", () => {
    mockUseSuccessRate.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { rate_pct: 95.2, delta_pp: 2.3, completed: 476, failed: 24, total: 500, prior_rate_pct: 92.9 },
    });
    render(<SuccessRateKpiCard />);
    expect(screen.getByText("Success Rate")).toBeInTheDocument();
    expect(screen.getByText("95.2%")).toBeInTheDocument();
    expect(screen.getByText("+2.3pp vs prior period")).toBeInTheDocument();
  });

  it("applies up class for positive delta", () => {
    mockUseSuccessRate.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { rate_pct: 95.2, delta_pp: 2.3, completed: 476, failed: 24, total: 500, prior_rate_pct: 92.9 },
    });
    render(<SuccessRateKpiCard />);
    expect(screen.getByText("+2.3pp vs prior period")).toHaveClass("kpi-delta", "up");
  });

  it("applies down class for negative delta", () => {
    mockUseSuccessRate.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { rate_pct: 88.0, delta_pp: -3.5, completed: 440, failed: 60, total: 500, prior_rate_pct: 91.5 },
    });
    render(<SuccessRateKpiCard />);
    expect(screen.getByText("-3.5pp vs prior period")).toHaveClass("kpi-delta", "down");
  });

  it("renders no class for zero delta", () => {
    mockUseSuccessRate.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { rate_pct: 90.0, delta_pp: 0, completed: 450, failed: 50, total: 500, prior_rate_pct: 90.0 },
    });
    render(<SuccessRateKpiCard />);
    const delta = screen.getByText("0.0pp vs prior period");
    expect(delta).toHaveClass("kpi-delta");
    expect(delta).not.toHaveClass("up");
    expect(delta).not.toHaveClass("down");
  });
});
