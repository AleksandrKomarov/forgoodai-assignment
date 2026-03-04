import { render, screen, fireEvent } from "@testing-library/react";
import TeamSelector from "./TeamSelector";

const mockUseTeamList = vi.fn();
vi.mock("../../hooks/useTeamDrillDown", () => ({
  useTeamList: () => mockUseTeamList(),
}));

describe("TeamSelector", () => {
  it("shows skeleton while loading", () => {
    mockUseTeamList.mockReturnValue({ isLoading: true, isError: false });
    const { container } = render(
      <TeamSelector selected="" onSelect={vi.fn()} />,
    );
    expect(container.querySelector(".skeleton")).toBeInTheDocument();
  });

  it("renders team buttons", () => {
    mockUseTeamList.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        teams: [
          { team_id: "t1", team_name: "ML Platform" },
          { team_id: "t2", team_name: "Data Eng" },
        ],
      },
    });
    render(<TeamSelector selected="" onSelect={vi.fn()} />);
    expect(screen.getByText("ML Platform")).toBeInTheDocument();
    expect(screen.getByText("Data Eng")).toBeInTheDocument();
  });

  it("highlights selected team", () => {
    mockUseTeamList.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        teams: [
          { team_id: "t1", team_name: "ML Platform" },
          { team_id: "t2", team_name: "Data Eng" },
        ],
      },
    });
    render(<TeamSelector selected="t1" onSelect={vi.fn()} />);
    expect(screen.getByText("ML Platform").className).toContain("active");
  });

  it("calls onSelect when clicked", () => {
    const onSelect = vi.fn();
    mockUseTeamList.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        teams: [{ team_id: "t1", team_name: "ML Platform" }],
      },
    });
    render(<TeamSelector selected="" onSelect={onSelect} />);
    fireEvent.click(screen.getByText("ML Platform"));
    expect(onSelect).toHaveBeenCalledWith("t1");
  });
});
