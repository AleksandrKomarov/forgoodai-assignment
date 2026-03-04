import {
  formatCurrencyCompact,
  formatCurrencyFull,
  formatCurrencyPrecise,
  formatPercent,
  formatCount,
  formatSignedPercent,
  formatDuration,
  formatRelativeTime,
  getDeltaClass,
  formatLatencyDelta,
  getLatencyDeltaClass,
} from "./formatters";

describe("formatCurrencyCompact", () => {
  it("formats millions", () => expect(formatCurrencyCompact(1_234_567)).toBe("$1.2M"));
  it("formats thousands", () => expect(formatCurrencyCompact(47_200)).toBe("$47.2K"));
  it("formats small values", () => expect(formatCurrencyCompact(42)).toBe("$42"));
});

describe("formatCurrencyFull", () => {
  it("formats with separator", () => expect(formatCurrencyFull(21_340)).toBe(`$${(21340).toLocaleString()}`));
  it("rounds decimals", () => expect(formatCurrencyFull(99.7)).toBe("$100"));
});

describe("formatCurrencyPrecise", () => {
  it("formats two decimals", () => expect(formatCurrencyPrecise(5.07)).toBe("$5.07"));
  it("pads zeros", () => expect(formatCurrencyPrecise(3)).toBe("$3.00"));
});

describe("formatPercent", () => {
  it("formats one decimal", () => expect(formatPercent(96.3)).toBe("96.3%"));
  it("pads zero decimal", () => expect(formatPercent(100)).toBe("100.0%"));
});

describe("formatCount", () => {
  it("formats with separator", () => expect(formatCount(12_847)).toBe((12847).toLocaleString()));
  it("rounds decimals", () => expect(formatCount(99.9)).toBe("100"));
});

describe("formatSignedPercent", () => {
  it("formats positive with plus", () => expect(formatSignedPercent(8.3)).toBe("+8.3%"));
  it("formats negative", () => expect(formatSignedPercent(-2.1)).toBe("-2.1%"));
  it("formats zero", () => expect(formatSignedPercent(0)).toBe("0.0%"));
});

describe("formatDuration", () => {
  it("converts ms to seconds", () => expect(formatDuration(4200)).toBe("4.2s"));
  it("handles sub-second", () => expect(formatDuration(500)).toBe("0.5s"));
});

describe("formatRelativeTime", () => {
  it("formats minutes", () => {
    const iso = new Date(Date.now() - 15 * 60_000).toISOString();
    expect(formatRelativeTime(iso)).toBe("15 min ago");
  });

  it("formats singular hour", () => {
    const iso = new Date(Date.now() - 60 * 60_000).toISOString();
    expect(formatRelativeTime(iso)).toBe("1 hour ago");
  });

  it("formats plural hours", () => {
    const iso = new Date(Date.now() - 3 * 60 * 60_000).toISOString();
    expect(formatRelativeTime(iso)).toBe("3 hours ago");
  });

  it("formats singular day", () => {
    const iso = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
    expect(formatRelativeTime(iso)).toBe("1 day ago");
  });

  it("formats plural days", () => {
    const iso = new Date(Date.now() - 5 * 24 * 60 * 60_000).toISOString();
    expect(formatRelativeTime(iso)).toBe("5 days ago");
  });
});

describe("getDeltaClass", () => {
  it("returns empty for zero", () => expect(getDeltaClass(0, "cost")).toBe(""));

  it("cost increase is bad (down/red)", () => expect(getDeltaClass(5, "cost")).toBe("down"));
  it("cost decrease is good (up/green)", () => expect(getDeltaClass(-5, "cost")).toBe("up"));

  it("rate increase is good (up/green)", () => expect(getDeltaClass(5, "rate")).toBe("up"));
  it("rate decrease is bad (down/red)", () => expect(getDeltaClass(-5, "rate")).toBe("down"));

  it("count increase is good (up/green)", () => expect(getDeltaClass(5, "count")).toBe("up"));
  it("count decrease is bad (down/red)", () => expect(getDeltaClass(-5, "count")).toBe("down"));
});

describe("formatLatencyDelta", () => {
  it.each([
    [80, "+80ms"],
    [-80, "-80ms"],
    [0, "0ms"],
    [999, "+999ms"],
    [-999, "-999ms"],
    [1000, "+1.0s"],
    [1400, "+1.4s"],
    [-1200, "-1.2s"],
  ])("formatLatencyDelta(%i) => %s", (ms, expected) => {
    expect(formatLatencyDelta(ms)).toBe(expected);
  });
});

describe("getLatencyDeltaClass", () => {
  it.each([
    [0, ""],
    [-80, "up"],
    [-1200, "up"],
    [320, "down"],
    [1400, "down"],
  ])("getLatencyDeltaClass(%i) => %s", (ms, expected) => {
    expect(getLatencyDeltaClass(ms)).toBe(expected);
  });
});
