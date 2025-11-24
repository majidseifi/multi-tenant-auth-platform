import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { Alert } from "./Alert";
import { BrandAuthThemeProvider } from "../ThemeProvider/ThemeProvider";

expect.extend(toHaveNoViolations);

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<BrandAuthThemeProvider>{ui}</BrandAuthThemeProvider>);
};

describe("Alert", () => {
  it("renders alert message", () => {
    renderWithTheme(<Alert>This is an alert</Alert>);
    expect(screen.getByText("This is an alert")).toBeInTheDocument();
  });

  it("renders with title", () => {
    renderWithTheme(<Alert title="Error">Something went wrong</Alert>);
    expect(screen.getByText("Error")).toBeInTheDocument();
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("renders different variants", () => {
    const { rerender } = renderWithTheme(
      <Alert variant="success">Success</Alert>
    );
    expect(screen.getByText("Success")).toBeInTheDocument();

    rerender(
      <BrandAuthThemeProvider>
        <Alert variant="error">Error</Alert>
      </BrandAuthThemeProvider>
    );
    expect(screen.getByText("Error")).toBeInTheDocument();
  });

  it("shows dismiss button when dismissible", () => {
    renderWithTheme(
      <Alert dismissible onDismiss={() => {}}>
        Dismissible
      </Alert>
    );
    expect(screen.getByLabelText("Dismiss alert")).toBeInTheDocument();
  });

  it("calls onDismiss when dismiss button clicked", async () => {
    const handleDismiss = vi.fn();
    const user = userEvent.setup();

    renderWithTheme(
      <Alert dismissible onDismiss={handleDismiss}>
        Dismissible alert
      </Alert>
    );

    await user.click(screen.getByLabelText("Dismiss alert"));
    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  it("has proper ARIA role for error variant", () => {
    renderWithTheme(<Alert variant="error">Error message</Alert>);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("has proper ARIA role for info variant", () => {
    renderWithTheme(<Alert variant="info">Info message</Alert>);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithTheme(<Alert>Accessible alert</Alert>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
