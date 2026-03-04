import { render, screen } from "@testing-library/react";
import NewAgentTypesKpiCard from "./NewAgentTypesKpiCard";

const mockUseAgentAdoption = vi.fn();
vi.mock("../../hooks/useUsageCapacity", () => ({
  useAgentAdoption: () => mockUseAgentAdoption(),
}));

describe("NewAgentTypesKpiCard", () => {
  it("shows skeleton while loading", () => {
    mockUseAgentAdoption.mockReturnValue({ isLoading: true, isError: false });
    const { container } = render(<NewAgentTypesKpiCard />);
    expect(container.querySelector(".skeleton")).toBeInTheDocument();
  });

  it("renders count and types", () => {
    mockUseAgentAdoption.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        current_month: {
          new_count: 2,
          new_types: ["code-reviewer", "test-writer"],
        },
      },
    });
    render(<NewAgentTypesKpiCard />);
    expect(screen.getByText("New Agent Types (this month)")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("code-reviewer, test-writer")).toBeInTheDocument();
  });

  it("truncates types beyond 3", () => {
    mockUseAgentAdoption.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        current_month: {
          new_count: 5,
          new_types: ["a", "b", "c", "d", "e"],
        },
      },
    });
    render(<NewAgentTypesKpiCard />);
    expect(screen.getByText("a, b, c + 2 more")).toBeInTheDocument();
  });
});
