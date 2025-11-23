import React, { type ButtonHTMLAttributes, type ReactNode } from "react";
import styled, { css } from "styled-components";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children: ReactNode;
}

// Styled button with variant styles
const StyledButton = styled.button<ButtonProps>`
  /* Base styles */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${(props) => props.theme.spacing.sm};
  font-family: ${(props) => props.theme.fonts.body};
  font-weight: 500;
  border-radius: ${(props) => props.theme.borderRadius.md};
  transition: all 0.2s ease;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  border: 2px solid transparent;
  position: relative;
  white-space: nowrap;

  /* Size styles */
  ${(props) => {
    switch (props.size) {
      case "sm":
        return css`
          padding: ${props.theme.spacing.sm} ${props.theme.spacing.md};
          font-size: 14px;
          min-height: 32px;
        `;
      case "lg":
        return css`
          padding: ${props.theme.spacing.md} ${props.theme.spacing.xl};
          font-size: 18px;
          min-height: 48px;
        `;
      default: // md
        return css`
          padding: ${props.theme.spacing.sm} ${props.theme.spacing.lg};
          font-size: 16px;
          min-height: 40px;
        `;
    }
  }}

  /* Variant styles */
  ${(props) => {
    switch (props.variant) {
      case "primary":
        return css`
          background: ${props.theme.colors.primary};
          color: white;

          &:hover:not(:disabled) {
            background: ${props.theme.colors.primaryHover};
          }

          &:active:not(:disabled) {
            background: ${props.theme.colors.primaryActive};
          }
        `;

      case "secondary":
        return css`
          background: ${props.theme.colors.secondary};
          color: white;

          &:hover:not(:disabled) {
            opacity: 0.9;
          }
        `;

      case "outline":
        return css`
          background: transparent;
          color: ${props.theme.colors.primary};
          border-color: ${props.theme.colors.primary};

          &:hover:not(:disabled) {
            background: ${props.theme.colors.primary}10;
          }
        `;

      case "ghost":
        return css`
          background: transparent;
          color: ${props.theme.colors.primary};

          &:hover:not(:disabled) {
            background: ${props.theme.colors.primary}10;
          }
        `;

      case "danger":
        return css`
          background: ${props.theme.colors.error};
          color: white;

          &:hover:not(:disabled) {
            opacity: 0.9;
          }
        `;

      default:
        return css`
          background: ${props.theme.colors.primary};
          color: white;
        `;
    }
  }}

  /* Full width */
  ${(props) =>
    props.fullWidth &&
    css`
      width: 100%;
    `}

  /* Disabled state */
  &:disabled {
    opacity: 0.5;
  }

  /* Focus styles for accessibility */
  &:focus-visible {
    outline: 2px solid ${(props) => props.theme.colors.primary};
    outline-offset: 2px;
  }

  /* Loading state */
  ${(props) =>
    props.loading &&
    css`
      color: transparent;
      pointer-events: none;
    `}
`;

// Loading spinner overlay
const LoadingSpinner = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: currentColor;

  svg {
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

// Accessible Button Component
export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  "aria-label": ariaLabel,
  ...props
}) => {
  // If loading, button should be disabled
  const isDisabled = disabled || loading;

  return (
    <StyledButton
      variant={variant}
      size={size}
      loading={loading}
      fullWidth={fullWidth}
      disabled={isDisabled}
      aria-busy={loading}
      aria-label={ariaLabel}
      {...props}
    >
      {leftIcon && !loading && <span aria-hidden="true">{leftIcon}</span>}
      {children}
      {rightIcon && !loading && <span aria-hidden="true">{rightIcon}</span>}

      {loading && (
        <LoadingSpinner aria-label="Loading">
          <Loader2 size={size === "sm" ? 16 : size === "lg" ? 24 : 20} />
        </LoadingSpinner>
      )}
    </StyledButton>
  );
};
