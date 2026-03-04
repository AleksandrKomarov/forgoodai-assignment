import { render, screen } from "@testing-library/react";
import Sidebar from "./Sidebar";
import { useMatchRoute } from "@tanstack/react-router";

vi.mock("@tanstack/react-router", () => ({
  Link: vi.fn(({ children, className, to }) => (
    <a href={to} className={className ?? undefined}>
      {children}
    </a>
  )),
  useMatchRoute: vi.fn(),
}));

vi.mock("../navItems", () => ({
  navItems: [
    { to: "/page-a", label: "Page A", icon: "A", component: () => null },
    { to: "/page-b", label: "Page B", icon: "B", component: () => null },
  ],
}));

const mockUseMatchRoute = vi.mocked(useMatchRoute);

function renderSidebar(activeRoute?: string) {
  mockUseMatchRoute.mockReturnValue(
    (({ to }: { to: string }) => to === activeRoute) as ReturnType<
      typeof useMatchRoute
    >,
  );
  render(<Sidebar />);
}

describe("Sidebar", () => {
  it("renders the logo", () => {
    renderSidebar();
    expect(screen.getByText("Analytics")).toBeInTheDocument();
  });

  it("renders all nav links", () => {
    renderSidebar();
    expect(screen.getByText("Page A")).toBeInTheDocument();
    expect(screen.getByText("Page B")).toBeInTheDocument();
  });

  it("sets active class on the matching route", () => {
    renderSidebar("/page-a");
    const activeLink = screen.getByText("Page A").closest("a");
    const inactiveLink = screen.getByText("Page B").closest("a");
    expect(activeLink).toHaveClass("active");
    expect(inactiveLink).not.toHaveClass("active");
  });

  it("renders the tenant footer", () => {
    renderSidebar();
    expect(screen.getByText("Tenant: Acme Corp")).toBeInTheDocument();
  });

  it("links point to correct routes", () => {
    renderSidebar();
    expect(screen.getByText("Page A").closest("a")).toHaveAttribute("href", "/page-a");
    expect(screen.getByText("Page B").closest("a")).toHaveAttribute("href", "/page-b");
  });

  it("renders hamburger toggle button", () => {
    renderSidebar();
    expect(screen.getByLabelText("Open menu")).toBeInTheDocument();
  });
});
