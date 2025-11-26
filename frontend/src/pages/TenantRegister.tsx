import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { Button } from "../components/Button/Button";
import { Input } from "../components/Input/Input";
import { Card } from "../components/Card/Card";
import { Alert } from "../components/Alert/Alert";
import axios from "axios";

const RegisterContainer = styled.div`
  min-height: 100vh;
  min-width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow-y: auto;
`;

const RegisterCard = styled(Card)`
  width: 100%;
  max-width: 520px;
  margin: 0 auto;
  box-sizing: border-box;

  @media (max-width: 768px) {
    max-width: 100%;
  }
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 600;
  margin: 0 0 0.5rem;
  color: ${(props) => props.theme.colors.text};
`;

const SubText = styled.p`
  font-size: 16px;
  color: ${(props) => props.theme.colors.textSecondary};
  margin: 0;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const SlugPreview = styled.div`
  margin-top: 0.5rem;
  padding: 0.75rem;
  background: ${(props) => props.theme.colors.surface};
  border-radius: 6px;
  font-size: 14px;
  color: ${(props) => props.theme.colors.textSecondary};
  font-family: monospace;

  strong {
    color: ${(props) => props.theme.colors.text};
  }
`;

const HelperText = styled.p`
  font-size: 13px;
  color: ${(props) => props.theme.colors.textSecondary};
  margin: -0.5rem 0 0 0;
  line-height: 1.4;
`;

interface TenantFormData {
  name: string;
  slug: string;
}

interface TenantFormErrors {
  name?: string;
  slug?: string;
  general?: string;
}

export const TenantRegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<TenantFormData>({
    name: "",
    slug: "",
  });

  const [errors, setErrors] = useState<TenantFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slugCheckStatus, setSlugCheckStatus] = useState<
    "idle" | "checking" | "available" | "taken"
  >("idle");

  // Auto-generate slug from company name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "") // Remove special chars
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single
      .trim();
  };

  // Check slug availability with backend
  const checkSlugAvailability = async (slug: string) => {
    if (!slug || slug.length < 3) {
      setSlugCheckStatus("idle");
      return;
    }

    setSlugCheckStatus("checking");

    try {
      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";

      // Try to fetch tenant with this slug
      const response = await axios.get(`${API_URL}/tenants/${slug}`);

      // If we get a response, slug is taken
      if (response.data) {
        setSlugCheckStatus("taken");
        setErrors((prev) => ({
          ...prev,
          slug: "This URL is already taken. Please choose another.",
        }));
      }
    } catch (error) {
      // 404 means slug is available
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        setSlugCheckStatus("available");
        setErrors((prev) => ({ ...prev, slug: undefined }));
      } else {
        setSlugCheckStatus("idle");
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: TenantFormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Company name is required";
    } else if (formData.name.length > 255) {
      newErrors.name = "Company name must be less than 255 characters";
    }

    if (!formData.slug.trim()) {
      newErrors.slug = "URL slug is required";
    } else if (formData.slug.length < 3 || formData.slug.length > 50) {
      newErrors.slug = "URL slug must be 3-50 characters";
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug =
        "URL slug can only contain lowercase letters, numbers, and hyphens";
    }

    if (slugCheckStatus === "taken") {
      newErrors.slug = "This URL is already taken";
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
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";

      const response = await axios.post(`${API_URL}/tenants`, {
        name: formData.name,
        slug: formData.slug,
      });

      const { tenant } = response.data;

      // Success! Redirect to tenant login page
      navigate(`/t/${tenant.slug}/login`, {
        state: {
          message: `Welcome to ${tenant.name}! Please create your admin account.`,
        },
      });
    } catch (error: unknown) {
      console.error("Tenant registration error:", error);

      if (axios.isAxiosError(error) && error.response?.status === 409) {
        setErrors({
          slug: "This URL is already taken. Please choose another.",
        });
      } else if (axios.isAxiosError(error) && error.response?.data?.errors) {
        // Validation errors from backend
        const backendErrors = error.response.data.errors;
        const newErrors: TenantFormErrors = {};
        backendErrors.forEach((err: any) => {
          if (err.path === "name") newErrors.name = err.msg;
          if (err.path === "slug") newErrors.slug = err.msg;
        });
        setErrors(newErrors);
      } else {
        setErrors({ general: "Something went wrong. Please try again." });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name,
      slug: generateSlug(name),
    }));

    if (errors.name) {
      setErrors((prev) => ({ ...prev, name: undefined }));
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const slug = e.target.value.toLowerCase();
    setFormData((prev) => ({ ...prev, slug }));

    if (errors.slug) {
      setErrors((prev) => ({ ...prev, slug: undefined }));
    }

    // Debounce slug availability check
    const timer = setTimeout(() => {
      checkSlugAvailability(slug);
    }, 500);

    return () => clearTimeout(timer);
  };

  return (
    <RegisterContainer>
      <RegisterCard padding="lg" elevation="lg">
        <Header>
          <Title>Create Your Organization</Title>
          <SubText>Start your journey with our multi-tenant platform</SubText>
        </Header>

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

        <Form onSubmit={handleSubmit} noValidate>
          <Input
            label="Company Name"
            type="text"
            name="name"
            id="name"
            value={formData.name}
            onChange={handleNameChange}
            error={errors.name}
            required
            placeholder="Acme Corporation"
            helperText="Your organization's official name"
          />

          <div>
            <Input
              label="URL Slug"
              type="text"
              name="slug"
              id="slug"
              value={formData.slug}
              onChange={handleSlugChange}
              error={errors.slug}
              required
              placeholder="acme-corp"
              helperText="Choose a unique URL for your organization (lowercase, numbers, hyphens only)"
            />

            {formData.slug && (
              <SlugPreview>
                Your login URL will be:{" "}
                <strong>
                  {window.location.origin}/t/{formData.slug}/login
                </strong>
              </SlugPreview>
            )}

            {slugCheckStatus === "checking" && (
              <HelperText style={{ color: "#666" }}>
                Checking availability...
              </HelperText>
            )}
            {slugCheckStatus === "available" && (
              <HelperText style={{ color: "#10b981" }}>
                ✓ This URL is available
              </HelperText>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={isSubmitting}
            disabled={
              slugCheckStatus === "checking" || slugCheckStatus === "taken"
            }
          >
            Create Organization
          </Button>
        </Form>

        <HelperText style={{ textAlign: "center", marginTop: "1.5rem" }}>
          Already have an organization?{" "}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              const slug = prompt("Enter your organization's URL slug:");
              if (slug) navigate(`/t/${slug}/login`);
            }}
            style={{ color: "#667eea", fontWeight: 500 }}
          >
            Sign in
          </a>
        </HelperText>
      </RegisterCard>
    </RegisterContainer>
  );
};
