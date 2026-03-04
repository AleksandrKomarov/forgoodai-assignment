import { render, screen } from "@testing-library/react";
import UserActivityTable from "./UserActivityTable";

vi.mock("../../formatters", () => ({
  formatCount: (v: number) => `${v}`,
  formatPercent: (v: number) => `${v.toFixed(1)}%`,
  formatRelativeTime: (iso: string) => `${iso.slice(0, 10)}`,
}));

vi.mock("../../context/DateRangeContext", () => ({
  useDateRange: () => ({ start: "2026-02-03", end: "2026-03-04" }),
}));

const mockUseTeamUserActivity = vi.fn();
vi.mock("../../hooks/useTeamDrillDown", () => ({
  useTeamUserActivity: (...args: unknown[]) =>
    mockUseTeamUserActivity(...args),
}));

describe("UserActivityTable", () => {
  it("shows skeleton while loading", () => {
    mockUseTeamUserActivity.mockReturnValue({ isLoading: true, isError: false });
    const { container } = render(<UserActivityTable teamId="t1" />);
    expect(container.querySelector(".skeleton")).toBeInTheDocument();
  });

  it("renders title and table headers", () => {
    mockUseTeamUserActivity.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        users: [
          {
            user_id: "u1",
            user_name: "Alice Chen",
            run_count: 200,
            success_rate_pct: 95.0,
            last_active: "2026-03-03T12:00:00Z",
          },
        ],
      },
    });
    render(<UserActivityTable teamId="t1" />);
    expect(screen.getByText("User Activity")).toBeInTheDocument();
    expect(screen.getByText("User")).toBeInTheDocument();
    expect(screen.getByText("Last Active")).toBeInTheDocument();
  });

  it("renders user data", () => {
    mockUseTeamUserActivity.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        users: [
          {
            user_id: "u1",
            user_name: "Alice Chen",
            run_count: 200,
            success_rate_pct: 95.0,
            last_active: "2026-03-03T12:00:00Z",
          },
        ],
      },
    });
    render(<UserActivityTable teamId="t1" />);
    expect(screen.getByText("Alice Chen")).toBeInTheDocument();
    expect(screen.getByText("200")).toBeInTheDocument();
  });

  it("shows empty state when no data", () => {
    mockUseTeamUserActivity.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { users: [] },
    });
    render(<UserActivityTable teamId="t1" />);
    expect(screen.getByText("No data for selected period")).toBeInTheDocument();
  });
});
