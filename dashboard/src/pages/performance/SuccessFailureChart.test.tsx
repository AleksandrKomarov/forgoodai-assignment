import { render, screen } from "@testing-library/react";
import SuccessFailureChart from "./SuccessFailureChart";

vi.mock("../../formatters", () => ({
  formatCount: (v: number) => `${v}`,
}));

vi.mock("../../context/DateRangeContext", () => ({
  useDateRange: () => ({ start: "2026-02-03", end: "2026-03-04" }),
}));

const mockUseSuccessFailureTimeseries = vi.fn();
vi.mock("../../hooks/usePerformance", () => ({
  useSuccessFailureTimeseries: (...args: unknown[]) =>
    mockUseSuccessFailureTimeseries(...args),
}));

describe("SuccessFailureChart", () => {
  it("shows skeleton while loading", () => {
    mockUseSuccessFailureTimeseries.mockReturnValue({
      isLoading: true,
      isError: false,
    });
    const { container } = render(<SuccessFailureChart />);
    expect(container.querySelector(".skeleton")).toBeInTheDocument();
  });

  it("renders card title and legend", () => {
    mockUseSuccessFailureTimeseries.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        daily: [
          { date: "2026-02-03", completed: 900, failed: 50 },
          { date: "2026-02-04", completed: 850, failed: 60 },
        ],
      },
    });
    render(<SuccessFailureChart />);
    expect(
      screen.getByText("Success / Failure Rates Over Time"),
    ).toBeInTheDocument();
    expect(screen.getByText("Success")).toBeInTheDocument();
    expect(screen.getByText("Failed")).toBeInTheDocument();
  });

  it("renders bars for each day", () => {
    mockUseSuccessFailureTimeseries.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        daily: [
          { date: "2026-02-03", completed: 900, failed: 50 },
          { date: "2026-02-04", completed: 850, failed: 60 },
        ],
      },
    });
    const { container } = render(<SuccessFailureChart />);
    expect(container.querySelectorAll(".sf-bar-col")).toHaveLength(2);
  });

  it("shows empty state when no data", () => {
    mockUseSuccessFailureTimeseries.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { daily: [] },
    });
    render(<SuccessFailureChart />);
    expect(
      screen.getByText("No data for selected period"),
    ).toBeInTheDocument();
  });
});
