import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DateRangeSelector from "./DateRangeSelector";
import { useDateRange } from "../context/DateRangeContext";

vi.mock("../context/DateRangeContext", () => ({
  useDateRange: vi.fn(),
  presetLabels: { a: "Label A", b: "Label B" },
}));

const mockUseDateRange = vi.mocked(useDateRange);

function renderSelector(preset = "a") {
  const setPreset = vi.fn();
  mockUseDateRange.mockReturnValue({
    preset: preset as "30d",
    setPreset,
    start: "2026-01-01",
    end: "2026-01-31",
  });
  const user = userEvent.setup();
  render(<DateRangeSelector />);
  return { user, setPreset };
}

describe("DateRangeSelector", () => {
  it("renders all preset options", () => {
    renderSelector();
    expect(screen.getByRole("option", { name: "Label A" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Label B" })).toBeInTheDocument();
  });

  it("reflects the current preset from context", () => {
    renderSelector("b");
    expect(screen.getByRole("combobox")).toHaveValue("b");
  });

  it("calls setPreset when selection changes", async () => {
    const { user, setPreset } = renderSelector();
    await user.selectOptions(screen.getByRole("combobox"), "b");
    expect(setPreset).toHaveBeenCalledWith("b");
  });
});
