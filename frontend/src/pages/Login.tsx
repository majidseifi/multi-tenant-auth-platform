import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { Button } from "../components/Button/Button";
import { Input } from "../components/Input/Input";
import { Card } from "../components/Card/Card";
import { Logo } from "../components/Logo/Logo";
import { Alert } from "../components/Alert/Alert";
import { LoadingSpinner } from "../components/LoadingSpinner/LoadingSpinner";
import { useTheme } from "../components/ThemeProvider/useTheme";
import axios, { AxiosError } from "axios";

const LoginContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${(props) => props.theme.spacing.lg};
  background: ${(props) => props.theme.colors.surface};
`;

const LoginCard = styled(Card)`
  width: 100%;
  max-width: 420px;
`;

const LoginHeader = styled.div`
  text-align: center;
  margin-bottom: ${(props) => props.theme.spacing.xl};
`;

const WelcomeText = styled.h1`
  font-size: 24px;
  font-weight: 600;
  margin: ${(props) => props.theme.spacing.lg} 0
    ${(props) => props.theme.spacing.sm};
  color: ${(props) => props.theme.colors.text};
`;

const SubText = styled.p`
  font-size: 14px;
  color: ${(props) => props.theme.colors.textSecondary};
  margin: 0;
`;

const LoginForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spacing.md};
`;

const ForgotPassword = styled.a`
  font-size: 14px;
  text-align: right;
  margin-top: -${(props) => props.theme.spacing.sm};
  color: ${(props) => props.theme.colors.primary};

  &:hover {
    text-decoration: underline;
  }
`;

const Divider = styled.div`
  text-align: center;
  margin: ${(props) => props.theme.spacing.lg} 0;
  position: relative;

  &::before {
    content: "";
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background: ${(props) => props.theme.colors.border};
    z-index: 0;
  }

  span {
    position: relative;
    background: ${(props) => props.theme.colors.background};
    padding: 0 ${(props) => props.theme.spacing.md};
    font-size: 12px;
    color: ${(props) => props.theme.colors.textSecondary};
    z-index: 1;
  }
`;

const SignupPrompt = styled.div`
  text-align: center;
  font-size: 14px;
  color: ${(props) => props.theme.colors.textSecondary};

  a {
    color: ${(props) => props.theme.colors.primary};
    font-weight: 500;

    &:hover {
      text-decoration: underline;
    }
  }
`;

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginErrors {
  email?: string;
  password?: string;
  general?: string;
}

// Branded Login Page
export const LoginPage: React.FC = () => {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const navigate = useNavigate();
  const { theme, loadTenantTheme, isLoading: themeLoading } = useTheme();

  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<LoginErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasLoadedTheme = useRef(false);

  // Load tenant theme when component mounts
  useEffect(() => {
    if (tenantSlug && !hasLoadedTheme.current) {
      hasLoadedTheme.current = true;
      loadTenantTheme(tenantSlug);
    }
  }, [tenantSlug, loadTenantTheme]);

  /**
   * Validate form fields
   */
  const validateForm = (): boolean => {
    const newErrors: LoginErrors = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous general error
    setErrors((prev) => ({ ...prev, general: undefined }));

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";

      const response = await axios.post(
        `${API_URL}/t/${tenantSlug}/auth/login`,
        formData
      );

      const { access_token, refresh_token, user } = response.data;

      // Store tokens
      localStorage.setItem("access_token", access_token);
      localStorage.setItem("refresh_token", refresh_token);
      localStorage.setItem("user", JSON.stringify(user));

      // Redirect to dashboard
      navigate(`/t/${tenantSlug}/dashboard`);
    } catch (error) {
      console.error("Login error:", error);

      if (error instanceof AxiosError) {
        if (error.response?.status === 401) {
          setErrors({ general: "Invalid email or password" });
        } else if (error.response?.status === 403) {
          setErrors({
            general: error.response.data?.error || "Account locked or inactive",
          });
        } else {
          setErrors({ general: "Something went wrong. Please try again." });
        }
      } else {
        setErrors({ general: "Something went wrong. Please try again." });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle input change
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear field error when user starts typing
    if (errors[name as keyof LoginErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // Show loading spinner while theme is loading
  if (themeLoading) {
    return (
      <LoginContainer>
        <LoadingSpinner text="Loading..." centered />
      </LoginContainer>
    );
  }

  return (
    <LoginContainer>
      <LoginCard padding="lg" elevation="lg">
        <LoginHeader>
          <Logo
            src={theme.logoUrl}
            alt={`${theme.tenantName} logo`}
            fallbackText={theme.tenantName}
            size="md"
          />

          <WelcomeText>Welcome back</WelcomeText>
          <SubText>Sign in to {theme.tenantName}</SubText>
        </LoginHeader>

        {errors.general && (
          <Alert
            variant="error"
            dismissible
            onDismiss={() =>
              setErrors((prev) => ({ ...prev, general: undefined }))
            }
          >
            {errors.general}
          </Alert>
        )}

        <LoginForm onSubmit={handleSubmit} noValidate>
          <Input
            label="Email"
            type="email"
            name="email"
            id="email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            required
            autoComplete="email"
            placeholder="you@example.com"
          />

          <Input
            label="Password"
            type="password"
            name="password"
            id="password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            required
            autoComplete="current-password"
            placeholder="Enter your password"
            showPasswordToggle
          />

          <ForgotPassword href={`/t/${tenantSlug}/forgot-password`}>
            Forgot password?
          </ForgotPassword>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={isSubmitting}
          >
            Sign In
          </Button>
        </LoginForm>

        <Divider>
          <span>or</span>
        </Divider>

        <SignupPrompt>
          Don't have an account?{" "}
          <a href={`/t/${tenantSlug}/register`}>Sign up</a>
        </SignupPrompt>
      </LoginCard>
    </LoginContainer>
  );
};
