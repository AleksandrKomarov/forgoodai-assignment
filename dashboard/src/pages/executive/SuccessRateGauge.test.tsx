import { render, screen } from "@testing-library/react";
import SuccessRateGauge from "./SuccessRateGauge";

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

describe("SuccessRateGauge", () => {
  it("shows skeleton while loading", () => {
    mockUseSuccessRate.mockReturnValue({ isLoading: true, isError: false });
    const { container } = render(<SuccessRateGauge />);
    expect(container.querySelector(".skeleton")).toBeInTheDocument();
  });

  it("renders rate value and subtitle", () => {
    mockUseSuccessRate.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { rate_pct: 95.2, delta_pp: 2.3, completed: 476, failed: 24, total: 500, prior_rate_pct: 92.9 },
    });
    render(<SuccessRateGauge />);
    expect(screen.getByText("Overall Success Rate")).toBeInTheDocument();
    expect(screen.getByText("95.2%")).toBeInTheDocument();
    expect(screen.getByText("30-day avg")).toBeInTheDocument();
  });

  it("renders SVG gauge circles", () => {
    mockUseSuccessRate.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { rate_pct: 80.0, delta_pp: -1.0, completed: 400, failed: 100, total: 500, prior_rate_pct: 81.0 },
    });
    const { container } = render(<SuccessRateGauge />);
    const circles = container.querySelectorAll("circle");
    expect(circles).toHaveLength(2);
  });
});
