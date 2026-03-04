import { render, screen } from "@testing-library/react";
import ActiveUsersKpiCard from "./ActiveUsersKpiCard";

vi.mock("../../formatters", () => ({
  formatCount: (v: number) => `${v}`,
}));

vi.mock("../../context/DateRangeContext", () => ({
  useDateRange: () => ({ start: "2026-02-03", end: "2026-03-04" }),
}));

const mockUseActiveUsers = vi.fn();
vi.mock("../../hooks/useUsageCapacity", () => ({
  useActiveUsers: (...args: unknown[]) => mockUseActiveUsers(...args),
}));

describe("ActiveUsersKpiCard", () => {
  it("shows skeleton while loading", () => {
    mockUseActiveUsers.mockReturnValue({ isLoading: true, isError: false });
    const { container } = render(<ActiveUsersKpiCard />);
    expect(container.querySelector(".skeleton")).toBeInTheDocument();
  });

  it("renders label with days and value", () => {
    mockUseActiveUsers.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { days: 30, active_users: 65, delta_users: 8 },
    });
    render(<ActiveUsersKpiCard />);
    expect(screen.getByText("Active Users (30d)")).toBeInTheDocument();
    expect(screen.getByText("65")).toBeInTheDocument();
  });

  it("renders positive delta with up class", () => {
    mockUseActiveUsers.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { days: 30, active_users: 65, delta_users: 8 },
    });
    render(<ActiveUsersKpiCard />);
    const delta = screen.getByText("+8 vs prior period");
    expect(delta.className).toContain("up");
  });

  it("renders negative delta with down class", () => {
    mockUseActiveUsers.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { days: 30, active_users: 50, delta_users: -3 },
    });
    render(<ActiveUsersKpiCard />);
    const delta = screen.getByText("-3 vs prior period");
    expect(delta.className).toContain("down");
  });
});
