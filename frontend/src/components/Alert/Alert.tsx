import React, { type ReactNode } from "react";
import styled, { css } from "styled-components";
import { AlertCircle, CheckCircle, Info, X, AlertTriangle } from "lucide-react";

export interface AlertProps {
  variant?: "info" | "success" | "warning" | "error";
  title?: string;
  children: ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  icon?: ReactNode;
}
const AlertContainer = styled.div<{
  variant: "info" | "success" | "warning" | "error";
}>`
  display: flex;
  gap: ${(props) => props.theme.spacing.md};
  padding: ${(props) => props.theme.spacing.md};
  border-radius: ${(props) => props.theme.borderRadius.md};
  border: 1px solid;
  position: relative;

  ${(props) => {
    switch (props.variant) {
      case "success":
        return css`
          background: ${props.theme.colors.success}15;
          border-color: ${props.theme.colors.success};
          color: ${props.theme.colors.success};
        `;
      case "warning":
        return css`
          background: ${props.theme.colors.warning}15;
          border-color: ${props.theme.colors.warning};
          color: #856404;
        `;
      case "error":
        return css`
          background: ${props.theme.colors.error}15;
          border-color: ${props.theme.colors.error};
          color: ${props.theme.colors.error};
        `;
      default: // info
        return css`
          background: ${props.theme.colors.primary}15;
          border-color: ${props.theme.colors.primary};
          color: ${props.theme.colors.primary};
        `;
    }
  }}
`;

const IconWrapper = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: flex-start;
  padding-top: 2px;
`;

const Content = styled.div`
  flex: 1;
  min-width: 0;
`;

const Title = styled.h4`
  margin: 0 0 ${(props) => props.theme.spacing.xs} 0;
  font-size: 14px;
  font-weight: 600;
  color: ${(props) => props.theme.colors.text};
`;

const Message = styled.div`
  font-size: 14px;
  line-height: 1.5;
  color: ${(props) => props.theme.colors.text};
`;

const DismissButton = styled.button`
  flex-shrink: 0;
  background: none;
  border: none;
  padding: ${(props) => props.theme.spacing.xs};
  cursor: pointer;
  color: currentColor;
  opacity: 0.6;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${(props) => props.theme.borderRadius.sm};
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 1;
  }

  &:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 2px;
  }
`;

// Get default icon for variant
const getDefaultIcon = (variant: "info" | "success" | "warning" | "error") => {
  switch (variant) {
    case "success":
      return <CheckCircle size={20} />;
    case "warning":
      return <AlertTriangle size={20} />;
    case "error":
      return <AlertCircle size={20} />;
    default:
      return <Info size={20} />;
  }
};

// Accessible Alert Component
export const Alert: React.FC<AlertProps> = ({
  variant = "info",
  title,
  children,
  dismissible = false,
  onDismiss,
  icon,
}) => {
  const defaultIcon = getDefaultIcon(variant);
  const displayIcon = icon || defaultIcon;

  // Use role="alert" for error/warning (assertive)
  // Use role="status" for info/success (polite)
  const role =
    variant === "error" || variant === "warning" ? "alert" : "status";
  const ariaLive =
    variant === "error" || variant === "warning" ? "assertive" : "polite";

  return (
    <AlertContainer
      variant={variant}
      role={role}
      aria-live={ariaLive}
      aria-atomic="true"
    >
      <IconWrapper aria-hidden="true">{displayIcon}</IconWrapper>

      <Content>
        {title && <Title>{title}</Title>}
        <Message>{children}</Message>
      </Content>

      {dismissible && onDismiss && (
        <DismissButton
          onClick={onDismiss}
          aria-label="Dismiss alert"
          type="button"
        >
          <X size={16} />
        </DismissButton>
      )}
    </AlertContainer>
  );
};
