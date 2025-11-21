import { createContext } from "react";
import { type TenantTheme } from "../../theme/types";

export interface ThemeContextValue {
  theme: TenantTheme;
  setTheme: (theme: TenantTheme) => void;
  loadTenantTheme: (slug: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(
  undefined
);
