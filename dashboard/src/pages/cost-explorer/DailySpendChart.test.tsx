import { render, screen } from "@testing-library/react";
import DailySpendChart from "./DailySpendChart";

vi.mock("../../formatters", () => ({
  formatCurrencyCompact: (v: number) => `$${v}`,
}));

vi.mock("../../context/DateRangeContext", () => ({
  useDateRange: () => ({ start: "2026-02-03", end: "2026-03-04" }),
}));

const mockUseDailySpend = vi.fn();
vi.mock("../../hooks/useCostExplorer", () => ({
  useDailySpend: (...args: unknown[]) => mockUseDailySpend(...args),
}));

describe("DailySpendChart", () => {
  it("shows skeleton while loading", () => {
    mockUseDailySpend.mockReturnValue({ isLoading: true, isError: false });
    const { container } = render(<DailySpendChart dimension="team" granularity="daily" />);
    expect(container.querySelector(".skeleton")).toBeInTheDocument();
  });

  it("renders dynamic title based on dimension and granularity", () => {
    mockUseDailySpend.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        series: [
          { key: "t1", label: "Alpha", data: [{ date: "2026-02-03", spend_usd: 100 }] },
        ],
      },
    });
    render(<DailySpendChart dimension="team" granularity="daily" />);
    expect(screen.getByText("Daily Spend by Team")).toBeInTheDocument();
  });

  it("renders title for agent_type and weekly", () => {
    mockUseDailySpend.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        series: [
          { key: "code-gen", label: "code-gen", data: [{ date: "2026-02-03", spend_usd: 100 }] },
        ],
      },
    });
    render(<DailySpendChart dimension="agent_type" granularity="weekly" />);
    expect(screen.getByText("Weekly Spend by Agent Type")).toBeInTheDocument();
  });

  it("renders stacked bars and legend", () => {
    mockUseDailySpend.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        series: [
          {
            key: "t1",
            label: "Alpha",
            data: [
              { date: "2026-02-03", spend_usd: 200 },
              { date: "2026-02-04", spend_usd: 150 },
            ],
          },
          {
            key: "t2",
            label: "Beta",
            data: [
              { date: "2026-02-03", spend_usd: 100 },
              { date: "2026-02-04", spend_usd: 50 },
            ],
          },
        ],
      },
    });
    const { container } = render(<DailySpendChart dimension="team" granularity="daily" />);
    expect(container.querySelectorAll(".stacked-bar-col")).toHaveLength(2);
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
  });

  it("shows empty state when no data", () => {
    mockUseDailySpend.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { series: [] },
    });
    render(<DailySpendChart dimension="team" granularity="daily" />);
    expect(screen.getByText("No data for selected period")).toBeInTheDocument();
  });

  it("passes correct arguments to hook", () => {
    mockUseDailySpend.mockReturnValue({ isLoading: true, isError: false });
    render(<DailySpendChart dimension="agent_type" granularity="monthly" />);
    expect(mockUseDailySpend).toHaveBeenCalledWith(
      "2026-02-03",
      "2026-03-04",
      "agent_type",
      "monthly",
    );
  });
});
