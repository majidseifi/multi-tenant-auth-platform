import { createGlobalStyle } from "styled-components";
import { type TenantTheme } from "../../theme/types";

// Global styles that apply theme colors
export const GlobalStyles = createGlobalStyle<{ theme: TenantTheme }>`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: ${(props) => props.theme.fonts.body};
    background-color: ${(props) => props.theme.colors.background};
    color: ${(props) => props.theme.colors.text};
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: ${(props) => props.theme.fonts.heading};
    font-weight: 600;
    line-height: 1.2;
  }

  a {
    color: ${(props) => props.theme.colors.primary};
    text-decoration: none;

    &:hover {
      color: ${(props) => props.theme.colors.primaryHover};
      text-decoration: underline;
    }

    &:focus-visible {
      outline: 2px solid ${(props) => props.theme.colors.primary};
      outline-offset: 2px;
      border-radius: ${(props) => props.theme.borderRadius.sm};
    }
  }

  /* Improve focus visibility for accessibility */
  *:focus-visible {
    outline: 2px solid ${(props) => props.theme.colors.primary};
    outline-offset: 2px;
  }

  /* Remove default button styles */
  button {
    font-family: inherit;
    cursor: pointer;
  }

  /* Screen reader only content */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
`;
