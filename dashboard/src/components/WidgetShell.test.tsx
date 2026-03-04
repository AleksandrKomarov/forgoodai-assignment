import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WidgetShell from "./WidgetShell";

describe("WidgetShell", () => {
  it("shows skeleton when loading", () => {
    const { container } = render(
      <WidgetShell isLoading={true} isError={false} className="card">
        <p>Content</p>
      </WidgetShell>,
    );
    expect(container.querySelector(".skeleton")).toBeInTheDocument();
    expect(screen.queryByText("Content")).not.toBeInTheDocument();
  });

  it("applies className to loading wrapper", () => {
    const { container } = render(
      <WidgetShell isLoading={true} isError={false} className="kpi">
        <p>Content</p>
      </WidgetShell>,
    );
    expect(container.firstChild).toHaveClass("kpi");
  });

  it("shows error with retry button", async () => {
    const refetch = vi.fn();
    render(
      <WidgetShell isLoading={false} isError={true} refetch={refetch} className="card">
        <p>Content</p>
      </WidgetShell>,
    );
    expect(screen.getByText("Failed to load data")).toBeInTheDocument();
    expect(screen.queryByText("Content")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(refetch).toHaveBeenCalledOnce();
  });

  it("shows error without retry button when refetch is not provided", () => {
    render(
      <WidgetShell isLoading={false} isError={true} className="card">
        <p>Content</p>
      </WidgetShell>,
    );
    expect(screen.getByText("Failed to load data")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows empty state when isEmpty is true", () => {
    render(
      <WidgetShell isLoading={false} isError={false} isEmpty={true} className="card">
        <p>Content</p>
      </WidgetShell>,
    );
    expect(screen.getByText("No data for selected period")).toBeInTheDocument();
    expect(screen.queryByText("Content")).not.toBeInTheDocument();
  });

  it("renders children when loaded successfully", () => {
    render(
      <WidgetShell isLoading={false} isError={false} className="card">
        <p>Content</p>
      </WidgetShell>,
    );
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("prioritizes loading over error", () => {
    const { container } = render(
      <WidgetShell isLoading={true} isError={true} className="card">
        <p>Content</p>
      </WidgetShell>,
    );
    expect(container.querySelector(".skeleton")).toBeInTheDocument();
    expect(screen.queryByText("Failed to load data")).not.toBeInTheDocument();
    expect(screen.queryByText("Content")).not.toBeInTheDocument();
  });

  it("prioritizes error over empty", () => {
    render(
      <WidgetShell isLoading={false} isError={true} isEmpty={true} className="card">
        <p>Content</p>
      </WidgetShell>,
    );
    expect(screen.getByText("Failed to load data")).toBeInTheDocument();
    expect(screen.queryByText("No data for selected period")).not.toBeInTheDocument();
  });
});
