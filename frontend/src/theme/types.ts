// Tenant specific theme configurations

export interface TenantTheme {
    // Tenant info
    tenantId: string;
    tenantName: string;
    tenantSlug: string;

    // Branding
    logoUrl?: string;
    primaryColor: string;
    secondaryColor: string;

    // Generated colors (computer from primary/secondary)
    colors: {
        primary: string;
        primaryHover: string;
        primaryActive: string;
        secondary: string;
        background: string;
        surface: string;
        text: string;
        textSecondary: string;
        error: string;
        success: string;
        warning: string;
        border: string;
    };

    // Typography
    fonts: {
        body: string;
        heading: string;
    };

    // Spacing
    spacing: {
        xs: string;
        sm: string;
        md: string;
        lg: string;
        xl: string;
    };

    // Border radius
    borderRadius: {
        sm: string;
        md: string;
        lg: string;
    };

    // Shadows
    shadows: {
        sm: string;
        md: string;
        lg: string;
    };
}

// Default theme (fallback)
export const defaultTheme: TenantTheme = {
    tenantId: '',
    tenantName: 'BrandAuth',
    tenantSlug: 'default',
    logoUrl: undefined,
    primaryColor: '#007bff',
    secondaryColor: '#6c757d',
    colors: {
        primary: '#007bff',
        primaryHover: '#0056b3',
        primaryActive: '#004085',
        secondary: '#6c757d',
        background: '#ffffff',
        surface: '#f8f9fa',
        text: '#212529',
        textSecondary: '#6c757d',
        error: '#dc3545',
        success: '#28a745',
        warning: '#ffc107',
        border: '#dee2e6',
    },
    fonts: {
        body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        heading: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    },
    spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
    },
    borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
    },
    shadows: {
        sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
    },
};