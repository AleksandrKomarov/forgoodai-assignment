import { toDateString, today, daysAgo, daysBetween, earliestDate } from "./dateUtils";

describe("toDateString", () => {
  it("formats a date as YYYY-MM-DD", () => {
    expect(toDateString(new Date("2026-03-04T12:00:00Z"))).toBe("2026-03-04");
  });

  it("pads single-digit month and day", () => {
    expect(toDateString(new Date("2026-01-05T00:00:00Z"))).toBe("2026-01-05");
  });
});

describe("today", () => {
  it("returns current date as YYYY-MM-DD", () => {
    expect(today()).toBe(toDateString(new Date()));
  });
});

describe("daysAgo", () => {
  it("returns a date N days in the past", () => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    expect(daysAgo(7)).toBe(toDateString(d));
  });
});

describe("daysBetween (inclusive)", () => {
  it.each([
    { a: "2026-02-01", b: "2026-03-03", expected: 31, label: "cross-month range" },
    { a: "2026-03-04", b: "2026-03-04", expected: 1, label: "same date" },
    { a: "2026-03-03", b: "2026-03-04", expected: 2, label: "consecutive days" },
    { a: "2025-03-04", b: "2026-03-04", expected: 366, label: "full year" },
  ])("$label: ($a, $b) → $expected", ({ a, b, expected }) => {
    expect(daysBetween(a, b)).toBe(expected);
  });
});

describe("earliestDate", () => {
  it("returns a date 2 years ago", () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 2);
    expect(earliestDate()).toBe(toDateString(d));
  });
});
