import styled from "styled-components";

export interface CardProps {
  // Card padding
  padding?: "sm" | "md" | "lg";
  // Card elevation (shadow)
  elevation?: "sm" | "md" | "lg";
  // Hover effect
  hoverable?: boolean;
}

// Card component for grouping content
export const Card = styled.div<CardProps>`
  background: ${(props) => props.theme.colors.background};
  border-radius: ${(props) => props.theme.borderRadius.lg};
  border: 1px solid ${(props) => props.theme.colors.border};

  // Padding
  padding: ${(props) => {
    switch (props.padding) {
      case "sm":
        return props.theme.spacing.md;
      case "lg":
        return props.theme.spacing.xl;
      default:
        return props.theme.spacing.lg;
    }
  }};

  // Shadow
  box-shadow: ${(props) => {
    switch (props.elevation) {
      case "sm":
        return props.theme.shadows.sm;
      case "lg":
        return props.theme.shadows.lg;
      default:
        return props.theme.shadows.md;
    }
  }};

  // Hover effect
  transition: all 0.2s ease;
  ${(props) =>
    props.hoverable &&
    `
    cursor: pointer;
    
    &:hover {
    box-shadow: ${props.theme.shadows.lg};
    transform: translateY(-2px);}`}
`;
