import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import type { ReactElement } from "react";
import { Button } from "./Button";
import { BrandAuthThemeProvider } from "../ThemeProvider/ThemeProvider";

expect.extend(toHaveNoViolations);

const renderWithTheme = (ui: ReactElement) => {
  return render(<BrandAuthThemeProvider>{ui}</BrandAuthThemeProvider>);
};

describe("Button", () => {
  it("renders button text", () => {
    renderWithTheme(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    renderWithTheme(<Button onClick={handleClick}>Click me</Button>);

    await user.click(screen.getByText("Click me"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("does not call onClick when disabled", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    renderWithTheme(
      <Button onClick={handleClick} disabled>
        Click me
      </Button>
    );

    await user.click(screen.getByText("Click me"));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("shows loading state", () => {
    renderWithTheme(<Button loading>Loading</Button>);
    expect(screen.getByLabelText("Loading")).toBeInTheDocument();
  });

  it("is disabled when loading", () => {
    renderWithTheme(<Button loading>Loading</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("renders with left icon", () => {
    renderWithTheme(
      <Button leftIcon={<span data-testid="left-icon">→</span>}>
        With Icon
      </Button>
    );
    expect(screen.getByTestId("left-icon")).toBeInTheDocument();
  });

  it("renders different variants", () => {
    const { rerender } = renderWithTheme(
      <Button variant="primary">Primary</Button>
    );
    expect(screen.getByText("Primary")).toBeInTheDocument();

    rerender(
      <BrandAuthThemeProvider>
        <Button variant="secondary">Secondary</Button>
      </BrandAuthThemeProvider>
    );
    expect(screen.getByText("Secondary")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithTheme(<Button>Accessible Button</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has proper ARIA attributes when loading", () => {
    renderWithTheme(<Button loading>Loading</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-busy", "true");
  });
});
