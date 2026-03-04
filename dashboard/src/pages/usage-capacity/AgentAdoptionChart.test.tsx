import { render, screen } from "@testing-library/react";
import AgentAdoptionChart from "./AgentAdoptionChart";

const mockUseAgentAdoption = vi.fn();
vi.mock("../../hooks/useUsageCapacity", () => ({
  useAgentAdoption: () => mockUseAgentAdoption(),
}));

describe("AgentAdoptionChart", () => {
  it("shows skeleton while loading", () => {
    mockUseAgentAdoption.mockReturnValue({ isLoading: true, isError: false });
    const { container } = render(<AgentAdoptionChart />);
    expect(container.querySelector(".skeleton")).toBeInTheDocument();
  });

  it("renders title and bars", () => {
    mockUseAgentAdoption.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        months: [
          { month: "2025-10", new_count: 3, new_types: ["a", "b", "c"] },
          { month: "2025-11", new_count: 2, new_types: ["d", "e"] },
        ],
      },
    });
    const { container } = render(<AgentAdoptionChart />);
    expect(screen.getByText("New Agent Types Adopted (Last 6 Months)")).toBeInTheDocument();
    expect(container.querySelectorAll(".adoption-bar")).toHaveLength(2);
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("shows empty state when no data", () => {
    mockUseAgentAdoption.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { months: [] },
    });
    render(<AgentAdoptionChart />);
    expect(screen.getByText("No data for selected period")).toBeInTheDocument();
  });
});
