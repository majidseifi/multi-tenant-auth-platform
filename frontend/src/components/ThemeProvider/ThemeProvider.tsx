import React, { useState, type ReactNode } from "react";
import { ThemeProvider as StyledThemeProvider } from "styled-components";
import { type TenantTheme, defaultTheme } from "../../theme/types";
import { createThemeFromTenant } from "../../theme/utils";
import axios, { AxiosError } from "axios";
import { ThemeContext, type ThemeContextValue } from "./ThemeContext";

// Theme Provider Component
// Manages tenant-specific themes and fetches branding from backend

export const BrandAuthThemeProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [theme, setTheme] = useState<TenantTheme>(defaultTheme);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load tenant theme from backend
  const loadTenantTheme = async (slug: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5050/api";
      const response = await axios.get(`${API_URL}/tenants/${slug}`);

      const tenantTheme = createThemeFromTenant(response.data);
      setTheme(tenantTheme);

      // Store in localstorage for persistence
      localStorage.setItem(`tenant_theme_${slug}`, JSON.stringify(tenantTheme));
    } catch (err) {
      console.error("Failed to load tenant theme:", err);
      const message =
        err instanceof AxiosError
          ? err.response?.data?.error || err.message
          : "Failed to load tenant theme";
      setError(message);

      // Fallback to cached theme if available
      const cached = localStorage.getItem(`tenant_theme_${slug}`);
      if (cached) {
        setTheme(JSON.parse(cached));
      } else {
        setTheme(defaultTheme);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const value: ThemeContextValue = {
    theme,
    setTheme,
    loadTenantTheme,
    isLoading,
    error,
  };

  return (
    <ThemeContext.Provider value={value}>
      <StyledThemeProvider theme={theme}>{children}</StyledThemeProvider>
    </ThemeContext.Provider>
  );
};
