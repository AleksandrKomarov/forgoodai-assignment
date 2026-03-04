import { render, screen, fireEvent } from "@testing-library/react";
import CustomRangeInput from "./CustomRangeInput";
import { useDateRange } from "../context/DateRangeContext";

vi.mock("../context/DateRangeContext", () => ({
  useDateRange: vi.fn(),
}));

const mockUseDateRange = vi.mocked(useDateRange);

function twoYearsAgo() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 2);
  return d.toISOString().slice(0, 10);
}

function renderInput(start = "2026-01-01", end = "2026-01-31") {
  const setCustomRange = vi.fn();
  mockUseDateRange.mockReturnValue({
    start,
    end,
    setCustomRange,
  } as unknown as ReturnType<typeof useDateRange>);
  render(<CustomRangeInput />);
  return { setCustomRange };
}

describe("CustomRangeInput", () => {
  it("renders start and end date inputs", () => {
    renderInput();
    expect(screen.getByLabelText("Start date")).toHaveValue("2026-01-01");
    expect(screen.getByLabelText("End date")).toHaveValue("2026-01-31");
  });

  it("calls setCustomRange when change produces valid range", () => {
    const { setCustomRange } = renderInput();
    fireEvent.change(screen.getByLabelText("Start date"), { target: { value: "2026-01-15" } });
    expect(setCustomRange).toHaveBeenCalledWith("2026-01-15", "2026-01-31");
  });

  it("does not call setCustomRange when change produces invalid range", () => {
    const { setCustomRange } = renderInput();
    setCustomRange.mockClear();
    fireEvent.change(screen.getByLabelText("Start date"), { target: { value: "2026-02-15" } });
    expect(setCustomRange).not.toHaveBeenCalled();
  });

  it("does not allow dates before 2 years ago", () => {
    renderInput();
    const min = twoYearsAgo();
    expect(screen.getByLabelText("Start date")).toHaveAttribute("min", min);
    expect(screen.getByLabelText("End date")).toHaveAttribute("min", min);
  });

  it("does not allow dates after today", () => {
    const max = new Date().toISOString().slice(0, 10);
    renderInput();
    expect(screen.getByLabelText("Start date")).toHaveAttribute("max", max);
    expect(screen.getByLabelText("End date")).toHaveAttribute("max", max);
  });

  it("shows no error for a valid range", () => {
    renderInput("2026-01-01", "2026-01-31");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows error when end is before start", () => {
    renderInput("2026-02-01", "2026-01-01");
    expect(screen.getByRole("alert")).toHaveTextContent("End date must be after start date");
  });

  it("shows error when range exceeds 365 days", () => {
    renderInput("2024-01-01", "2025-01-02");
    expect(screen.getByRole("alert")).toHaveTextContent("Range cannot exceed 365 days");
  });

  it("shows error when a date is missing", () => {
    renderInput("2026-01-01", "");
    expect(screen.getByRole("alert")).toHaveTextContent("Both dates are required");
  });
});
