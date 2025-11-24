import React from "react";
import styled, { keyframes } from "styled-components";
import { Loader2 } from "lucide-react";

export interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  centered?: boolean;
}

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const SpinnerContainer = styled.div<{ centered?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${(props) => props.theme.spacing.md};

  ${(props) =>
    props.centered &&
    `
    justify-content: center;
    min-height: 200px;
  `}
`;

const SpinnerIcon = styled(Loader2)<{ spinnerSize: "sm" | "md" | "lg" }>`
  color: ${(props) => props.theme.colors.primary};
  animation: ${spin} 0.6s linear infinite;

  ${(props) => {
    switch (props.spinnerSize) {
      case "sm":
        return "width: 20px; height: 20px;";
      case "lg":
        return "width: 48px; height: 48px;";
      default:
        return "width: 32px; height: 32px;";
    }
  }}
`;

const LoadingText = styled.p`
  margin: 0;
  font-size: 14px;
  color: ${(props) => props.theme.colors.textSecondary};
`;

// Accessible Loading Spinner
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  text,
  centered = false,
}) => {
  return (
    <SpinnerContainer centered={centered} role="status" aria-live="polite">
      <SpinnerIcon spinnerSize={size} aria-hidden="true" />
      {text && <LoadingText>{text}</LoadingText>}
      <span className="sr-only">{text || "Loading, please wait"}</span>
    </SpinnerContainer>
  );
};
