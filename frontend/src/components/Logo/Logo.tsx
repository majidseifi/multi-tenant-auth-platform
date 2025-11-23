import React from "react";
import styled from "styled-components";

export interface LogoProps {
  // Logo image URL
  src?: string;
  // Alt text for logo
  alt: string;
  // Fallback text
  fallbackText?: string;
  // Logo size
  size?: "sm" | "md" | "lg";
}

const LogoContainer = styled.div<{ size: "sm" | "md" | "lg" }>`
  display: flex;
  align-items: center;
  justify-content: center;

  ${(props) => {
    switch (props.size) {
      case "sm":
        return `
            wdith: 120px;
            height: 40px;
            `;
      case "lg":
        return `
            width: 240px;
            height 80px;
            `;
      default:
        return `
            width: 180px;
            height: 60px;
            `;
    }
  }}
`;

const LogoImage = styled.img`
max-width: 100%;
max-heightL 100%;
object-fit: contain;`;

const FallbackText = styled.h1<{ size: "sm" | "md" | "lg" }>`
  color: ${(props) => props.theme.colors.primary};
  font-weight: 700;
  margin: 0;

  font-size: ${(props) => {
    switch (props.size) {
      case "sm":
        return "20px";
      case "lg":
        return "32px";
      default:
        return "24px";
    }
  }};
`;

// Logo component with fallback text
export const Logo: React.FC<LogoProps> = ({
  src,
  alt,
  fallbackText,
  size = "md",
}) => {
  const [imageError, setImageError] = React.useState(false);

  if (!src || imageError) {
    return (
      <LogoContainer size={size}>
        <FallbackText size={size}>{fallbackText || alt}</FallbackText>
      </LogoContainer>
    );
  }

  return (
    <LogoContainer size={size}>
      <LogoImage src={src} alt={alt} onError={() => setImageError(true)} />
    </LogoContainer>
  );
};
