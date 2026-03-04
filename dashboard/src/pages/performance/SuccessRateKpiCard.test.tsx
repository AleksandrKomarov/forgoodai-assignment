import { render, screen } from "@testing-library/react";
import SuccessRateKpiCard from "./SuccessRateKpiCard";

vi.mock("../../formatters", () => ({
  formatPercent: (v: number) => `${v}%`,
}));

vi.mock("../../context/DateRangeContext", () => ({
  useDateRange: () => ({ start: "2026-02-03", end: "2026-03-04" }),
}));

const mockUsePerfSuccessRate = vi.fn();
vi.mock("../../hooks/usePerformance", () => ({
  usePerfSuccessRate: (...args: unknown[]) => mockUsePerfSuccessRate(...args),
}));

describe("SuccessRateKpiCard", () => {
  it("shows skeleton while loading", () => {
    mockUsePerfSuccessRate.mockReturnValue({ isLoading: true, isError: false });
    const { container } = render(<SuccessRateKpiCard />);
    expect(container.querySelector(".skeleton")).toBeInTheDocument();
  });

  it("renders label and value", () => {
    mockUsePerfSuccessRate.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { rate_pct: 96.3, delta_pp: 0.5 },
    });
    render(<SuccessRateKpiCard />);
    expect(screen.getByText("Success Rate")).toBeInTheDocument();
    expect(screen.getByText("96.3%")).toBeInTheDocument();
  });

  it("renders positive delta with up class", () => {
    mockUsePerfSuccessRate.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { rate_pct: 96.3, delta_pp: 0.5 },
    });
    render(<SuccessRateKpiCard />);
    const delta = screen.getByText("+0.5pp");
    expect(delta.className).toContain("up");
  });

  it("renders negative delta with down class", () => {
    mockUsePerfSuccessRate.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { rate_pct: 94.1, delta_pp: -1.2 },
    });
    render(<SuccessRateKpiCard />);
    const delta = screen.getByText("-1.2pp");
    expect(delta.className).toContain("down");
  });
});
