import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DateRangeSelector from "./DateRangeSelector";
import { useDateRange } from "../context/DateRangeContext";

const { mockPresets } = vi.hoisted(() => {
  const MockInput = () => <span data-testid="mock-input" />;
  const mockPresets = [
    { key: "a", label: "Label A", computeRange: () => ({ start: "", end: "" }) },
    { key: "b", label: "Label B", computeRange: () => ({ start: "", end: "" }) },
    { key: "custom", label: "Custom", InputComponent: MockInput },
  ];
  return { MockInput, mockPresets };
});

vi.mock("../context/DateRangeContext", () => ({
  useDateRange: vi.fn(),
}));

vi.mock("../presets", () => ({
  presets: mockPresets,
}));

const mockUseDateRange = vi.mocked(useDateRange);

function renderSelector(presetKey = "a") {
  const setPresetKey = vi.fn();
  const activePreset = mockPresets.find((p) => p.key === presetKey)!;
  mockUseDateRange.mockReturnValue({
    activePreset,
    setPresetKey,
  } as unknown as ReturnType<typeof useDateRange>);
  const user = userEvent.setup();
  render(<DateRangeSelector />);
  return { user, setPresetKey };
}

describe("DateRangeSelector", () => {
  it("renders all preset options", () => {
    renderSelector();
    expect(screen.getByRole("option", { name: "Label A" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Label B" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Custom" })).toBeInTheDocument();
  });

  it("reflects the current preset from context", () => {
    renderSelector("b");
    expect(screen.getByRole("combobox")).toHaveValue("b");
  });

  it("calls setPresetKey when selection changes", async () => {
    const { user, setPresetKey } = renderSelector();
    await user.selectOptions(screen.getByRole("combobox"), "b");
    expect(setPresetKey).toHaveBeenCalledWith("b");
  });

  it("does not render InputComponent for preset without one", () => {
    renderSelector("a");
    expect(screen.queryByTestId("mock-input")).not.toBeInTheDocument();
  });

  it("renders InputComponent for preset that has one", () => {
    renderSelector("custom");
    expect(screen.getByTestId("mock-input")).toBeInTheDocument();
  });
});
