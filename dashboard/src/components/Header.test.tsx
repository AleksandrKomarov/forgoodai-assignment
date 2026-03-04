import { render, screen } from "@testing-library/react";
import Header from "./Header";
import { DateRangeProvider } from "../context/DateRangeContext";

describe("Header", () => {
  it("renders the provided title", () => {
    render(
      <DateRangeProvider>
        <Header title="Test Page" />
      </DateRangeProvider>,
    );
    expect(screen.getByText("Test Page")).toBeInTheDocument();
  });
});
