import { render, screen } from "@testing-library/react";
import ErrorTaxonomyPie from "./ErrorTaxonomyPie";

vi.mock("../../formatters", () => ({
  formatCount: (v: number) => `${v}`,
}));

vi.mock("../../context/DateRangeContext", () => ({
  useDateRange: () => ({ start: "2026-02-03", end: "2026-03-04" }),
}));

const mockUseErrorTaxonomy = vi.fn();
vi.mock("../../hooks/usePerformance", () => ({
  useErrorTaxonomy: (...args: unknown[]) => mockUseErrorTaxonomy(...args),
}));

describe("ErrorTaxonomyPie", () => {
  it("shows skeleton while loading", () => {
    mockUseErrorTaxonomy.mockReturnValue({ isLoading: true, isError: false });
    const { container } = render(<ErrorTaxonomyPie />);
    expect(container.querySelector(".skeleton")).toBeInTheDocument();
  });

  it("renders card title", () => {
    mockUseErrorTaxonomy.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        total_failures: 1130,
        errors: [
          { error_code: "TIMEOUT", count: 500, pct: 44.2 },
          { error_code: "OOM", count: 630, pct: 55.8 },
        ],
      },
    });
    render(<ErrorTaxonomyPie />);
    expect(screen.getByText("Error Taxonomy")).toBeInTheDocument();
  });

  it("renders total failures in center", () => {
    mockUseErrorTaxonomy.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        total_failures: 1130,
        errors: [{ error_code: "TIMEOUT", count: 1130, pct: 100 }],
      },
    });
    render(<ErrorTaxonomyPie />);
    expect(screen.getByText("1130")).toBeInTheDocument();
    expect(screen.getByText("failures")).toBeInTheDocument();
  });

  it("renders legend rows for each error", () => {
    mockUseErrorTaxonomy.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        total_failures: 1000,
        errors: [
          { error_code: "TIMEOUT", count: 600, pct: 60 },
          { error_code: "OOM", count: 400, pct: 40 },
        ],
      },
    });
    render(<ErrorTaxonomyPie />);
    expect(screen.getByText("TIMEOUT — 60% (600)")).toBeInTheDocument();
    expect(screen.getByText("OOM — 40% (400)")).toBeInTheDocument();
  });

  it("renders SVG circles for each error", () => {
    mockUseErrorTaxonomy.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        total_failures: 1000,
        errors: [
          { error_code: "TIMEOUT", count: 600, pct: 60 },
          { error_code: "OOM", count: 400, pct: 40 },
        ],
      },
    });
    const { container } = render(<ErrorTaxonomyPie />);
    expect(container.querySelectorAll("circle")).toHaveLength(2);
  });

  it("shows empty state when no errors", () => {
    mockUseErrorTaxonomy.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { total_failures: 0, errors: [] },
    });
    render(<ErrorTaxonomyPie />);
    expect(
      screen.getByText("No data for selected period"),
    ).toBeInTheDocument();
  });
});
