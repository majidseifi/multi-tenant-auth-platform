# Multi-Tenant Authentication Platform

Production-ready multi-tenant SaaS authentication system with complete tenant isolation, branded UI components, comprehensive testing, and AWS deployment.

## 📊 Project Status

**Status:** ✅ Production Ready

| Project | Status | Description |
|---------|--------|-------------|
| 1. Multi-Tenant Backend | ✅ Complete | JWT auth, RBAC, tenant isolation with RLS |
| 2. Branded UI Library | ✅ Complete | Accessible components with dynamic theming |
| 3. Comprehensive Testing | ✅ Complete | Unit, integration, and accessibility tests |
| 4. AWS Deployment | ✅ Complete | Docker, CI/CD, Nginx with SSL |

## Features

**Multi-Tenancy:**
- ✅ Complete tenant isolation with PostgreSQL row-level security
- ✅ Tenant-specific URL routing (`/t/:tenantSlug`)
- ✅ Tenant context in JWT tokens
- ✅ Cross-tenant attack prevention
- ✅ Dynamic tenant branding (logos, primary/secondary colors)

**Authentication & Security:**
- ✅ JWT authentication with access & refresh tokens
- ✅ Role-based access control (Admin, User, Viewer)
- ✅ Account lockout after failed login attempts
- ✅ Rate limiting on authentication endpoints
- ✅ bcrypt password hashing
- ✅ CORS & security headers with Helmet

**UI Component Library:**
- ✅ Accessible React components (Button, Input, Card, Alert, LoadingSpinner, Logo)
- ✅ Dynamic theming with styled-components
- ✅ WCAG 2.1 accessibility compliance
- ✅ Tenant-specific branding system
- ✅ Responsive design for all components

**Testing & Quality:**
- ✅ Backend unit & integration tests (Jest + Supertest)
- ✅ Frontend component tests (Vitest + React Testing Library)
- ✅ Multi-tenant isolation validation
- ✅ Accessibility testing with jest-axe
- ✅ Comprehensive test coverage

**DevOps & Deployment:**
- ✅ Docker containerization with multi-stage builds
- ✅ Production & development docker-compose configurations
- ✅ Nginx reverse proxy with SSL/TLS
- ✅ GitHub Actions CI/CD pipeline
- ✅ Automated testing and deployment workflow
- ✅ AWS-ready infrastructure setup

## Tech Stack

**Backend:**
- Node.js + Express + TypeScript
- PostgreSQL with multi-tenant schema
- JWT + bcrypt
- Passport.js for authentication
- Jest + Supertest for testing
- Helmet for security headers

**Frontend:**
- React 18 + TypeScript + Vite
- React Router v6
- styled-components for theming
- Axios with interceptors
- Vitest + React Testing Library
- jest-axe for accessibility testing

**DevOps & Infrastructure:**
- Docker + Docker Compose
- Nginx with SSL/TLS configuration
- GitHub Actions CI/CD
- AWS deployment ready (EC2, RDS)

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+
- Docker & Docker Compose (optional, for containerized setup)

### Development Setup

**Option 1: Docker (Recommended)**
```bash
# Clone repository
git clone https://github.com/majidseifi/multi-tenant-auth-platform.git
cd multi-tenant-auth-platform

# Copy environment file
cp .env.example .env
# Edit .env with your configuration

# Start with Docker Compose
docker-compose up -d
```

**Option 2: Local Development**
```bash
# Clone repository
git clone https://github.com/majidseifi/multi-tenant-auth-platform.git
cd multi-tenant-auth-platform

# Backend setup
cd backend
npm install
cp .env.example .env
# Edit .env with your database URL and JWT secrets
npm run dev

# Frontend setup (separate terminal)
cd frontend
npm install
npm run dev
```

**Access:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- API Endpoints: http://localhost:5000/api/t/:tenantSlug

### Running Tests

**Backend Tests:**
```bash
cd backend
npm test              # Run all tests
npm run test:watch    # Watch mode
```

**Frontend Tests:**
```bash
cd frontend
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:ui       # UI mode with Vitest
```

## Project Structure

```
multi-tenant-auth-platform/
├── backend/
│   ├── src/
│   │   ├── __tests__/         # Jest unit & integration tests
│   │   ├── config/            # Database & app configuration
│   │   ├── controllers/       # Auth, User, Tenant controllers
│   │   ├── middleware/        # Auth, tenant isolation, rate limiter
│   │   ├── models/            # User, Tenant models
│   │   ├── routes/            # Multi-tenant API routes
│   │   ├── utils/             # JWT & helper utilities
│   │   └── server.ts          # Express server
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/        # Branded UI component library
│   │   │   ├── Alert/
│   │   │   ├── Button/
│   │   │   ├── Card/
│   │   │   ├── Input/
│   │   │   ├── LoadingSpinner/
│   │   │   ├── Logo/
│   │   │   └── ThemeProvider/
│   │   ├── contexts/          # Auth & tenant context
│   │   ├── pages/             # Login, Register, Dashboard
│   │   ├── services/          # API client services
│   │   ├── theme/             # Theming utilities
│   │   ├── test/              # Test setup & utilities
│   │   └── App.tsx
│   ├── Dockerfile
│   └── package.json
├── .github/
│   └── workflows/
│       └── deploy.yml         # CI/CD pipeline
├── docker-compose.yml         # Development setup
├── docker-compose.prod.yml    # Production setup
├── nginx-production.conf      # Nginx configuration
├── nginx-ssl.conf             # SSL/TLS configuration
└── README.md
```

## Database Schema

**Tenants:**
- id, name, slug, logo_url, primary_color, secondary_color
- plan, max_users, is_active

**Users:**
- id, tenant_id (foreign key), email, password_hash
- first_name, last_name, role
- failed_login_attempts, locked_until

**Refresh Tokens:**
- id, user_id, tenant_id, token_hash, expires_at

All queries enforce tenant isolation: `WHERE tenant_id = $1`

## Deployment

### Production Deployment with Docker

```bash
# Build and run production containers
docker-compose -f docker-compose.prod.yml up -d
```

### CI/CD Pipeline

The project includes a GitHub Actions workflow that:
- ✅ Runs all tests on push to main
- ✅ Builds Docker containers
- ✅ Deploys to production environment
- ✅ Includes PostgreSQL service for testing

### Environment Variables

Required environment variables (see `.env.example`):

**Backend:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT signing
- `JWT_REFRESH_SECRET` - Secret for refresh tokens
- `PORT` - Server port (default: 5000)

**Frontend:**
- `VITE_API_URL` - Backend API URL

## Key Implementation Highlights

### Multi-Tenant Isolation
- Row-level security (RLS) in PostgreSQL ensures complete data isolation
- All database queries include `WHERE tenant_id = $1` clauses
- JWT tokens contain tenant context for automatic filtering
- Comprehensive tests validate cross-tenant access prevention

### Dynamic Theming
- Theme context provides tenant-specific colors and branding
- styled-components enables runtime theme switching
- Tenant branding loaded from database on login
- Fallback to default theme for unauthenticated users

### Security Features
- Account lockout after 5 failed login attempts
- Rate limiting on authentication endpoints (100 requests/15 minutes)
- Refresh token rotation with automatic cleanup
- Helmet.js security headers
- CORS configuration for allowed origins

### Component Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation support
- ARIA labels and roles
- Focus management
- Screen reader compatibility tested with jest-axe

## License

MIT

## Author

**Majid Seifi Kashani**

- Website: [seifi.dev](https://seifi.dev)
- LinkedIn: [linkedin.com/in/majidseifi](https://linkedin.com/in/majidseifi)
- Email: majid@seifi.dev
