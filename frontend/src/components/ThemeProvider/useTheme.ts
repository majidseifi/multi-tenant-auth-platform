import { useContext } from "react";
import { ThemeContext, type ThemeContextValue } from "./ThemeContext";

// Hook to use theme context
export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within BrandAuthThemeProvider");
  }
  return context;
};
