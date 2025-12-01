import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { Button } from "../components/Button/Button";
import { Input } from "../components/Input/Input";
import { Card } from "../components/Card/Card";
import { Logo } from "../components/Logo/Logo";
import { Alert } from "../components/Alert/Alert";
import { LoadingSpinner } from "../components/LoadingSpinner/LoadingSpinner";
import { useTheme } from "../components/ThemeProvider/useTheme";
import axios from "axios";

const RegisterContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${(props) => props.theme.spacing.lg};
  background: ${(props) => props.theme.colors.surface};
`;

const RegisterCard = styled(Card)`
  width: 100%;
  max-width: 480px;
`;

const RegisterHeader = styled.div`
  text-align: center;
  margin-bottom: ${(props) => props.theme.spacing.xl};
`;

const Title = styled.h1`
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

const RegisterForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spacing.md};
`;

const NameFields = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${(props) => props.theme.spacing.md};

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const LoginPrompt = styled.div`
  text-align: center;
  margin-top: ${(props) => props.theme.spacing.lg};
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

interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface RegisterErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

/**
 * Branded Registration Page
 *
 * Features:
 * - Tenant-branded registration
 * - Form validation
 * - Password strength indicator
 * - POST to /t/:tenantSlug/auth/register
 * - Checks tenant user limits
 * - Accessible form with error states
 */
export const RegisterPage: React.FC = () => {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const navigate = useNavigate();
  const { theme, loadTenantTheme, isLoading: themeLoading } = useTheme();

  const [formData, setFormData] = useState<RegisterFormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<RegisterErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (tenantSlug) {
      loadTenantTheme(tenantSlug);
    }
  }, [tenantSlug, loadTenantTheme]);

  const validateForm = (): boolean => {
    const newErrors: RegisterErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password =
        "Password must contain uppercase, lowercase, and number";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors((prev) => ({ ...prev, general: undefined }));

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5050/api";

      const response = await axios.post(
        `${API_URL}/t/${tenantSlug}/auth/register`,
        {
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          password: formData.password,
        }
      );

      const { access_token, refresh_token, user } = response.data;

      // Store tokens
      localStorage.setItem("access_token", access_token);
      localStorage.setItem("refresh_token", refresh_token);
      localStorage.setItem("user", JSON.stringify(user));

      // Redirect to dashboard
      navigate(`/t/${tenantSlug}/dashboard`);
    } catch (error: unknown) {
      console.error("Registration error:", error);

      if (axios.isAxiosError(error) && error.response?.status === 409) {
        setErrors({ email: "Email already exists for this organization" });
      } else if (axios.isAxiosError(error) && error.response?.status === 403) {
        setErrors({
          general: "User limit reached. Please contact your administrator.",
        });
      } else {
        setErrors({ general: "Something went wrong. Please try again." });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name as keyof RegisterErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  if (themeLoading) {
    return (
      <RegisterContainer>
        <LoadingSpinner text="Loading..." centered />
      </RegisterContainer>
    );
  }

  return (
    <RegisterContainer>
      <RegisterCard padding="lg" elevation="lg">
        <RegisterHeader>
          <Logo
            src={theme.logoUrl}
            alt={`${theme.tenantName} logo`}
            fallbackText={theme.tenantName}
            size="md"
          />

          <Title>Create your account</Title>
          <SubText>Join {theme.tenantName} today</SubText>
        </RegisterHeader>

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

        <RegisterForm onSubmit={handleSubmit} noValidate>
          <NameFields>
            <Input
              label="First Name"
              type="text"
              name="firstName"
              id="firstName"
              value={formData.firstName}
              onChange={handleChange}
              error={errors.firstName}
              required
              autoComplete="given-name"
              placeholder="John"
            />

            <Input
              label="Last Name"
              type="text"
              name="lastName"
              id="lastName"
              value={formData.lastName}
              onChange={handleChange}
              error={errors.lastName}
              required
              autoComplete="family-name"
              placeholder="Doe"
            />
          </NameFields>

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
            autoComplete="new-password"
            placeholder="At least 8 characters"
            helperText="Must contain uppercase, lowercase, and number"
            showPasswordToggle
          />

          <Input
            label="Confirm Password"
            type="password"
            name="confirmPassword"
            id="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            required
            autoComplete="new-password"
            placeholder="Re-enter your password"
            showPasswordToggle
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={isSubmitting}
          >
            Create Account
          </Button>
        </RegisterForm>

        <LoginPrompt>
          Already have an account?{" "}
          <a href={`/t/${tenantSlug}/login`}>Sign in</a>
        </LoginPrompt>
      </RegisterCard>
    </RegisterContainer>
  );
};
