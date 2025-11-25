import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import { Button } from "../components/Button/Button";
import { Input } from "../components/Input/Input";
import { Card } from "../components/Card/Card";
import { Alert } from "../components/Alert/Alert";
import { Logo } from "../components/Logo/Logo";
import { useTheme } from "../components/ThemeProvider/useTheme";
import axios from "axios";

const SettingsContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: ${(props) => props.theme.spacing.xl};
`;

const PageTitle = styled.h1`
  font-size: 28px;
  font-weight: 600;
  margin-bottom: ${(props) => props.theme.spacing.lg};
  color: ${(props) => props.theme.colors.text};
`;

const Section = styled.div`
  margin-bottom: ${(props) => props.theme.spacing.xl};
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: ${(props) => props.theme.spacing.md};
  color: ${(props) => props.theme.colors.text};
`;

const SectionDescription = styled.p`
  font-size: 14px;
  color: ${(props) => props.theme.colors.textSecondary};
  margin-bottom: ${(props) => props.theme.spacing.lg};
`;

const ColorInputWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${(props) => props.theme.spacing.md};

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const ColorPreview = styled.div<{ color: string }>`
  width: 40px;
  height: 40px;
  border-radius: ${(props) => props.theme.borderRadius.md};
  background: ${(props) => props.color};
  border: 2px solid ${(props) => props.theme.colors.border};
`;

const ColorInputGroup = styled.div`
  display: flex;
  gap: ${(props) => props.theme.spacing.md};
  align-items: flex-end;

  > div {
    flex: 1;
  }
`;

const LogoUploadArea = styled.div`
  border: 2px dashed ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.md};
  padding: ${(props) => props.theme.spacing.xl};
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${(props) => props.theme.colors.primary};
    background: ${(props) => props.theme.colors.primary}05;
  }

  input[type="file"] {
    display: none;
  }
`;

const LogoPreviewContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${(props) => props.theme.spacing.md};
  margin-bottom: ${(props) => props.theme.spacing.md};
`;

const RemoveLogoButton = styled(Button)`
  margin-top: ${(props) => props.theme.spacing.sm};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${(props) => props.theme.spacing.md};
  justify-content: flex-end;
`;

interface TenantBranding {
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
}

// Tenant Settings Page
export const TenantSettingsPage: React.FC = () => {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { theme, loadTenantTheme } = useTheme();

  const [branding, setBranding] = useState<TenantBranding>({
    logoUrl: theme.logoUrl,
    primaryColor: theme.primaryColor,
    secondaryColor: theme.secondaryColor,
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | undefined>(
    theme.logoUrl
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setBranding({
      logoUrl: theme.logoUrl,
      primaryColor: theme.primaryColor,
      secondaryColor: theme.secondaryColor,
    });
    setLogoPreview(theme.logoUrl);
  }, [theme]);

  // Handle logo file selection
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setErrorMessage("Please upload an image file");
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setErrorMessage("Logo must be less than 2MB");
        return;
      }

      setLogoFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  /**
   * Remove logo
   */
  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(undefined);
    setBranding((prev) => ({ ...prev, logoUrl: undefined }));
  };

  // Handle color changes
  const handleColorChange = (
    field: "primaryColor" | "secondaryColor",
    value: string
  ) => {
    setBranding((prev) => ({ ...prev, [field]: value }));
  };

  // Save branding settings
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const token = localStorage.getItem("access_token");

      // Upload logo if file selected
      let logoUrl = branding.logoUrl;
      if (logoFile) {
        const formData = new FormData();
        formData.append("logo", logoFile);

        const uploadResponse = await axios.post(
          `${API_URL}/tenants/${tenantSlug}/upload-logo`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        logoUrl = uploadResponse.data.logo_url;
      }

      // Update branding
      await axios.put(
        `${API_URL}/tenants/${tenantSlug}/branding`,
        {
          logo_url: logoUrl,
          primary_color: branding.primaryColor,
          secondary_color: branding.secondaryColor,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccessMessage("Branding updated successfully!");

      // Reload theme to apply changes
      await loadTenantTheme(tenantSlug!);
    } catch (error) {
      console.error("Error updating branding:", error);

      let message = "Failed to update branding";

      if (axios.isAxiosError(error) && error.response?.data?.error) {
        message = error.response.data.error;
      }

      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset to current theme
  const handleReset = () => {
    setBranding({
      logoUrl: theme.logoUrl,
      primaryColor: theme.primaryColor,
      secondaryColor: theme.secondaryColor,
    });
    setLogoPreview(theme.logoUrl);
    setLogoFile(null);
  };

  return (
    <SettingsContainer>
      <PageTitle>Branding Settings</PageTitle>

      {successMessage && (
        <Alert
          variant="success"
          dismissible
          onDismiss={() => setSuccessMessage(null)}
        >
          {successMessage}
        </Alert>
      )}

      {errorMessage && (
        <Alert
          variant="error"
          dismissible
          onDismiss={() => setErrorMessage(null)}
        >
          {errorMessage}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Card padding="lg" elevation="md">
          <Section>
            <SectionTitle>Logo</SectionTitle>
            <SectionDescription>
              Upload your company logo. It will appear on login pages and
              throughout the app. Recommended size: 240x80px. Max file size:
              2MB.
            </SectionDescription>

            {logoPreview && (
              <LogoPreviewContainer>
                <Logo
                  src={logoPreview}
                  alt="Logo preview"
                  fallbackText={theme.tenantName}
                  size="lg"
                />
                <RemoveLogoButton
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveLogo}
                  type="button"
                >
                  Remove Logo
                </RemoveLogoButton>
              </LogoPreviewContainer>
            )}

            <LogoUploadArea
              onClick={() => document.getElementById("logo-input")?.click()}
            >
              <input
                type="file"
                id="logo-input"
                accept="image/*"
                onChange={handleLogoChange}
              />
              <p>Click to upload or drag and drop</p>
              <p
                style={{ fontSize: "12px", color: theme.colors.textSecondary }}
              >
                PNG, JPG, SVG up to 2MB
              </p>
            </LogoUploadArea>
          </Section>

          <Section>
            <SectionTitle>Brand Colors</SectionTitle>
            <SectionDescription>
              Choose colors that match your brand. These will be applied to
              buttons, links, and other UI elements.
            </SectionDescription>

            <ColorInputWrapper>
              <ColorInputGroup>
                <Input
                  label="Primary Color"
                  type="text"
                  value={branding.primaryColor}
                  onChange={(e) =>
                    handleColorChange("primaryColor", e.target.value)
                  }
                  placeholder="#007bff"
                  helperText="Main brand color"
                />
                <ColorPreview color={branding.primaryColor} />
              </ColorInputGroup>

              <ColorInputGroup>
                <Input
                  label="Secondary Color"
                  type="text"
                  value={branding.secondaryColor}
                  onChange={(e) =>
                    handleColorChange("secondaryColor", e.target.value)
                  }
                  placeholder="#6c757d"
                  helperText="Accent color"
                />
                <ColorPreview color={branding.secondaryColor} />
              </ColorInputGroup>
            </ColorInputWrapper>
          </Section>
        </Card>

        <ActionButtons>
          <Button variant="outline" onClick={handleReset} type="button">
            Reset Changes
          </Button>
          <Button variant="primary" type="submit" loading={isSubmitting}>
            Save Branding
          </Button>
        </ActionButtons>
      </form>
    </SettingsContainer>
  );
};
