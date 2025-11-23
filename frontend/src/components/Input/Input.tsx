import React, { type InputHTMLAttributes, forwardRef, useId } from "react";
import styled, { css } from "styled-components";
import { AlertCircle, Eye, EyeOff } from "lucide-react";

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  // Input label
  label: string;
  // Error message
  error?: string;
  // Helper text:
  helperText?: string;
  // Input size
  size?: "sm" | "md" | "lg";
  // Show password toggle for password inputs
  showPasswordToggle?: boolean;
}

const InputWrapper = styled.div`
  margin-bottom: ${(props) => props.theme.spacing.md};
  width: 100%;
`;

const Label = styled.label<{ required?: boolean; disabled?: boolean }>`
  display: block;
  margin-bottom: ${(props) => props.theme.spacing.sm};
  font-size: 14px;
  font-weight: 500;
  color: ${(props) =>
    props.disabled
      ? props.theme.colors.textSecondary
      : props.theme.colors.text};

  ${(props) =>
    props.required &&
    css`
      &::after {
        content: " *";
        color: ${props.theme.colors.error};
      }
    `}
`;

const InputContainer = styled.div`
  position: relative;
  width: 100%;
`;

const StyledInput = styled.input<{
  hasError?: boolean;
  inputSize?: "sm" | "md" | "lg";
}>`
  width: 100%;
  font-family: ${(props) => props.theme.fonts.body};
  border: 2px solid
    ${(props) =>
      props.hasError ? props.theme.colors.error : props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.md};
  background: ${(props) => props.theme.colors.background};
  color: ${(props) => props.theme.colors.text};
  transition: all 0.2s ease;

  /* Size variants */
  ${(props) => {
    switch (props.inputSize) {
      case "sm":
        return css`
          padding: ${props.theme.spacing.sm} ${props.theme.spacing.md};
          font-size: 14px;
          min-height: 32px;
        `;
      case "lg":
        return css`
          padding: ${props.theme.spacing.md} ${props.theme.spacing.lg};
          font-size: 18px;
          min-height: 48px;
        `;
      default: // md
        return css`
          padding: ${props.theme.spacing.sm} ${props.theme.spacing.md};
          font-size: 16px;
          min-height: 40px;
        `;
    }
  }}

  /* Hover state */
  &:hover:not(:disabled) {
    border-color: ${(props) =>
      props.hasError ? props.theme.colors.error : props.theme.colors.primary};
  }

  /* Focus state */
  &:focus {
    outline: none;
    border-color: ${(props) =>
      props.hasError ? props.theme.colors.error : props.theme.colors.primary};
    box-shadow: 0 0 0 3px
      ${(props) =>
        props.hasError
          ? props.theme.colors.error
          : props.theme.colors.primary}20;
  }

  /* Disabled state */
  &:disabled {
    background: ${(props) => props.theme.colors.surface};
    color: ${(props) => props.theme.colors.textSecondary};
    cursor: not-allowed;
    opacity: 0.6;
  }

  /* Error state */
  ${(props) =>
    props.hasError &&
    css`
      padding-right: ${props.theme.spacing.xl};
    `}

  /* Password input padding for toggle button */
  &[type="password"] {
    padding-right: ${(props) => props.theme.spacing.xl};
  }
`;

const ErrorIcon = styled(AlertCircle)`
  position: absolute;
  right: ${(props) => props.theme.spacing.md};
  top: 50%;
  transform: translateY(-50%);
  color: ${(props) => props.theme.colors.error};
  pointer-events: none;
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: ${(props) => props.theme.spacing.md};
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  padding: ${(props) => props.theme.spacing.xs};
  color: ${(props) => props.theme.colors.textSecondary};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${(props) => props.theme.borderRadius.sm};

  &:hover {
    color: ${(props) => props.theme.colors.text};
  }

  &:focus-visible {
    outline: 2px solid ${(props) => props.theme.colors.primary};
    outline-offset: 2px;
  }
`;

const HelperText = styled.span<{ isError?: boolean }>`
  display: block;
  margin-top: ${(props) => props.theme.spacing.xs};
  font-size: 12px;
  color: ${(props) =>
    props.isError
      ? props.theme.colors.error
      : props.theme.colors.textSecondary};
`;

// Accessible Input Component with validation states
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      size = "md",
      showPasswordToggle = true,
      type = "text",
      required,
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const inputType = type === "password" && showPassword ? "text" : type;
    const isPasswordInput = type === "password";

    return (
      <InputWrapper>
        <Label htmlFor={inputId} required={required} disabled={disabled}>
          {label}
        </Label>

        <InputContainer>
          <StyledInput
            ref={ref}
            id={inputId}
            type={inputType}
            hasError={!!error}
            inputSize={size}
            required={required}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={
              error ? errorId : helperText ? helperId : undefined
            }
            {...props}
          />

          {error && <ErrorIcon size={20} aria-hidden="true" />}

          {isPasswordInput && showPasswordToggle && !error && (
            <PasswordToggle
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </PasswordToggle>
          )}
        </InputContainer>

        {error && (
          <HelperText id={errorId} isError role="alert">
            {error}
          </HelperText>
        )}

        {helperText && !error && (
          <HelperText id={helperId}>{helperText}</HelperText>
        )}
      </InputWrapper>
    );
  }
);

Input.displayName = "Input";
