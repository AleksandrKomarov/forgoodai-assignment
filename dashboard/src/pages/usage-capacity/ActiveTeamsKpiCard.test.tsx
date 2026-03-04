import { render, screen } from "@testing-library/react";
import ActiveTeamsKpiCard from "./ActiveTeamsKpiCard";

vi.mock("../../context/DateRangeContext", () => ({
  useDateRange: () => ({ start: "2026-02-03", end: "2026-03-04" }),
}));

const mockUseActiveUsers = vi.fn();
vi.mock("../../hooks/useUsageCapacity", () => ({
  useActiveUsers: (...args: unknown[]) => mockUseActiveUsers(...args),
}));

describe("ActiveTeamsKpiCard", () => {
  it("shows skeleton while loading", () => {
    mockUseActiveUsers.mockReturnValue({ isLoading: true, isError: false });
    const { container } = render(<ActiveTeamsKpiCard />);
    expect(container.querySelector(".skeleton")).toBeInTheDocument();
  });

  it("renders label and value", () => {
    mockUseActiveUsers.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { active_teams: 4, total_teams: 5 },
    });
    render(<ActiveTeamsKpiCard />);
    expect(screen.getByText("Active Teams")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("renders subtitle with total", () => {
    mockUseActiveUsers.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { active_teams: 4, total_teams: 5 },
    });
    render(<ActiveTeamsKpiCard />);
    expect(screen.getByText("4 of 5")).toBeInTheDocument();
  });
});
