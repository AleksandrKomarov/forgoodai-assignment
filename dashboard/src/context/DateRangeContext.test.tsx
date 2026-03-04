import { renderHook, act } from "@testing-library/react";
import { DateRangeProvider, useDateRange } from "./DateRangeContext";

function renderDateRange() {
  return renderHook(() => useDateRange(), {
    wrapper: DateRangeProvider,
  });
}

describe("DateRangeContext", () => {
  it("defaults to 30d preset", () => {
    const { result } = renderDateRange();
    expect(result.current.activePreset.key).toBe("30d");
    expect(result.current.start).toBeTruthy();
    expect(result.current.end).toBeTruthy();
  });

  it("switches preset", () => {
    const { result } = renderDateRange();
    act(() => result.current.setPresetKey("7d"));
    expect(result.current.activePreset.key).toBe("7d");
  });

  it("sets custom range", () => {
    const { result } = renderDateRange();
    act(() => result.current.setCustomRange("2026-01-15", "2026-02-15"));
    expect(result.current.activePreset.key).toBe("custom");
    expect(result.current.start).toBe("2026-01-15");
    expect(result.current.end).toBe("2026-02-15");
  });

  it("preserves custom range when switching back to custom", () => {
    const { result } = renderDateRange();
    act(() => result.current.setCustomRange("2026-01-15", "2026-02-15"));
    act(() => result.current.setPresetKey("7d"));
    expect(result.current.activePreset.key).toBe("7d");
    act(() => result.current.setPresetKey("custom"));
    expect(result.current.start).toBe("2026-01-15");
    expect(result.current.end).toBe("2026-02-15");
  });
});
