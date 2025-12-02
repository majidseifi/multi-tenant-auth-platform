#!/bin/bash

# SSL/TLS Setup Script for Multi-Tenant Auth Platform
# This script installs Certbot and configures Let's Encrypt SSL certificates

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored messages
print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root or with sudo"
    exit 1
fi

# Prompt for domain name
read -p "Enter your domain name (e.g., yourapp.com): " DOMAIN
read -p "Enter your email for Let's Encrypt notifications: " EMAIL

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
    print_error "Domain and email are required"
    exit 1
fi

print_message "Setting up SSL for domain: $DOMAIN"

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    print_error "Cannot detect OS"
    exit 1
fi

# Install Certbot based on OS
print_message "Installing Certbot..."

if [ "$OS" = "amzn" ] || [ "$OS" = "rhel" ] || [ "$OS" = "centos" ]; then
    # Amazon Linux / RHEL / CentOS
    yum install -y certbot python3-certbot-nginx
elif [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    # Ubuntu / Debian
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
else
    print_error "Unsupported OS: $OS"
    exit 1
fi

print_message "Certbot installed successfully"

# Check if Nginx is installed
if ! command -v nginx &> /dev/null; then
    print_warning "Nginx is not installed. Installing Nginx..."

    if [ "$OS" = "amzn" ] || [ "$OS" = "rhel" ] || [ "$OS" = "centos" ]; then
        amazon-linux-extras install nginx1 -y
    elif [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
        apt-get install -y nginx
    fi

    systemctl start nginx
    systemctl enable nginx
    print_message "Nginx installed and started"
fi

# Create directory for Let's Encrypt verification
mkdir -p /var/www/certbot
chown -R nginx:nginx /var/www/certbot || chown -R www-data:www-data /var/www/certbot

# Backup existing Nginx configuration
print_message "Backing up existing Nginx configuration..."
if [ -f /etc/nginx/nginx.conf ]; then
    cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup.$(date +%Y%m%d_%H%M%S)
fi

# Test Nginx configuration
nginx -t
if [ $? -ne 0 ]; then
    print_error "Nginx configuration test failed. Please fix the configuration and try again."
    exit 1
fi

# Obtain SSL certificate
print_message "Obtaining SSL certificate for $DOMAIN..."
print_warning "Make sure your domain is pointing to this server's IP address!"
read -p "Press Enter to continue or Ctrl+C to cancel..."

certbot --nginx \
    -d "$DOMAIN" \
    -d "www.$DOMAIN" \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    --redirect \
    --hsts \
    --staple-ocsp

if [ $? -eq 0 ]; then
    print_message "SSL certificate obtained successfully!"
else
    print_error "Failed to obtain SSL certificate"
    exit 1
fi

# Setup automatic renewal
print_message "Setting up automatic certificate renewal..."

# Create renewal script
cat > /usr/local/bin/renew-ssl.sh << 'EOF'
#!/bin/bash
# SSL Certificate Renewal Script

/usr/bin/certbot renew --quiet --post-hook "systemctl reload nginx"

# Log renewal attempts
echo "$(date): Certificate renewal check completed" >> /var/log/certbot-renew.log
EOF

chmod +x /usr/local/bin/renew-ssl.sh

# Setup cron job for automatic renewal (runs twice daily)
CRON_JOB="0 0,12 * * * /usr/local/bin/renew-ssl.sh"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "renew-ssl.sh"; then
    print_message "Cron job for SSL renewal already exists"
else
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    print_message "Cron job for SSL renewal created"
fi

# Create systemd timer as alternative to cron (optional)
cat > /etc/systemd/system/certbot-renewal.service << EOF
[Unit]
Description=Certbot SSL Certificate Renewal
After=network.target

[Service]
Type=oneshot
ExecStart=/usr/bin/certbot renew --quiet --post-hook "systemctl reload nginx"
EOF

cat > /etc/systemd/system/certbot-renewal.timer << EOF
[Unit]
Description=Certbot SSL Certificate Renewal Timer

[Timer]
OnCalendar=daily
RandomizedDelaySec=1h
Persistent=true

[Install]
WantedBy=timers.target
EOF

systemctl daemon-reload
systemctl enable certbot-renewal.timer
systemctl start certbot-renewal.timer

print_message "Systemd timer for SSL renewal created"

# Test renewal process (dry-run)
print_message "Testing certificate renewal process..."
certbot renew --dry-run

if [ $? -eq 0 ]; then
    print_message "Certificate renewal test passed!"
else
    print_warning "Certificate renewal test failed. Please check manually."
fi

# Display certificate information
print_message "SSL Certificate Information:"
certbot certificates

# Print final instructions
echo ""
echo "================================================================"
print_message "SSL Setup Complete!"
echo "================================================================"
echo ""
echo "Your SSL certificate has been installed for: $DOMAIN"
echo "Certificate location: /etc/letsencrypt/live/$DOMAIN/"
echo ""
echo "Automatic renewal is configured via:"
echo "  1. Cron job (runs twice daily)"
echo "  2. Systemd timer (runs daily)"
echo ""
echo "SSL certificates will automatically renew when they have 30 days or less until expiration."
echo ""
echo "To manually renew: sudo certbot renew"
echo "To check status: sudo systemctl status certbot-renewal.timer"
echo ""
print_message "Your site should now be accessible via HTTPS at https://$DOMAIN"
echo "================================================================"
