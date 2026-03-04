import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FilterBar from "./FilterBar";

describe("FilterBar", () => {
  const defaults = {
    dimension: "team" as const,
    granularity: "daily" as const,
    onDimensionChange: vi.fn(),
    onGranularityChange: vi.fn(),
  };

  it("renders dimension and granularity dropdowns", () => {
    render(<FilterBar {...defaults} />);
    expect(screen.getByText("Dimension:")).toBeInTheDocument();
    expect(screen.getByText("Period:")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Team")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Daily")).toBeInTheDocument();
  });

  it("calls onDimensionChange when dimension changes", async () => {
    const onDimensionChange = vi.fn();
    render(<FilterBar {...defaults} onDimensionChange={onDimensionChange} />);
    await userEvent.selectOptions(screen.getByDisplayValue("Team"), "agent_type");
    expect(onDimensionChange).toHaveBeenCalledWith("agent_type");
  });

  it("calls onGranularityChange when granularity changes", async () => {
    const onGranularityChange = vi.fn();
    render(<FilterBar {...defaults} onGranularityChange={onGranularityChange} />);
    await userEvent.selectOptions(screen.getByDisplayValue("Daily"), "weekly");
    expect(onGranularityChange).toHaveBeenCalledWith("weekly");
  });

  it("reflects current values", () => {
    render(<FilterBar {...defaults} dimension="agent_type" granularity="monthly" />);
    expect(screen.getByDisplayValue("Agent Type")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Monthly")).toBeInTheDocument();
  });
});
