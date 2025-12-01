import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BrandAuthThemeProvider } from "./components/ThemeProvider/ThemeProvider";
import { GlobalStyles } from "./components/ThemeProvider/GlobalStyles";
import { LoginPage } from "./pages/Login";
import { RegisterPage } from "./pages/Register";
import { TenantSettingsPage } from "./pages/TenantSettings";
import { TenantRegisterPage } from "./pages/TenantRegister";

// Main Application Component

function App() {
  return (
    <BrandAuthThemeProvider>
      <GlobalStyles />
      <BrowserRouter>
        <Routes>
          {/* Tenant Registration - Main Landing Page */}
          <Route path="/" element={<TenantRegisterPage />} />
          <Route path="/register" element={<TenantRegisterPage />} />

          {/* Tenant-scoped routes */}
          <Route path="/t/:tenantSlug/login" element={<LoginPage />} />
          <Route path="/t/:tenantSlug/register" element={<RegisterPage />} />
          <Route
            path="/t/:tenantSlug/settings/branding"
            element={<TenantSettingsPage />}
          />

          {/* TODO: Add protected routes for dashboard, profile, etc. */}
          <Route
            path="/t/:tenantSlug/dashboard"
            element={<div>Dashboard (Coming Soon)</div>}
          />

          {/* 404 - Not Found */}
          <Route path="*" element={<div>404 - Page Not Found</div>} />
        </Routes>
      </BrowserRouter>
    </BrandAuthThemeProvider>
  );
}

export default App;
