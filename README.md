# Multi-Tenant Authentication Platform

Production-ready multi-tenant SaaS authentication system with tenant isolation, branded UI, and comprehensive security.

## 📊 Project Progress

**Current Phase:** Project 1 - Multi-Tenant Backend ✅ Complete

| Project | Status | Branch |
|---------|--------|--------|
| 1. Multi-Tenant Backend | ✅ Complete | `main` |
| 2. Branded UI Library | ⏳ Not Started | - |
| 3. Comprehensive Testing | ⏳ Not Started | - |
| 4. AWS Deployment | ⏳ Not Started | - |

## Features

**Multi-Tenancy:**
- ✅ Tenant isolation with row-level security
- ✅ Tenant-specific URL routing (`/t/:tenantSlug`)
- ✅ Tenant context in JWT tokens
- ✅ Cross-tenant attack prevention
- ✅ Tenant branding (logo, colors)

**Authentication & Security:**
- ✅ JWT with access & refresh tokens
- ✅ Role-based access control (Admin, User, Viewer)
- ✅ Account lockout after failed attempts
- ✅ Rate limiting on auth endpoints
- ✅ Password hashing with bcrypt
- ✅ CORS & security headers

**Testing:**
- ✅ Backend tests (Jest + Supertest)
- ✅ Multi-tenant isolation tests
- ⏳ Frontend component tests (Project 2)
- ⏳ E2E tests with Playwright (Project 3)

## Tech Stack

**Backend:**
- Node.js + Express + TypeScript
- PostgreSQL with multi-tenant schema
- JWT + bcrypt
- Jest + Supertest

**Frontend:**
- React 18 + TypeScript + Vite
- React Router v6
- Axios with interceptors
- ⏳ Styled-components (Project 2)
- ⏳ Accessibility (WCAG 2.1 AA) (Project 2)

**Infrastructure (Project 4):**
- ⏳ Docker + Docker Compose
- ⏳ AWS (EC2, RDS, S3, CloudWatch)
- ⏳ GitHub Actions CI/CD

## Getting Started

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
- Backend: http://localhost:5000
- API: http://localhost:5000/api/t/:tenantSlug

## Project Structure

```
multi-tenant-auth-platform/
├── backend/
│   ├── src/
│   │   ├── __tests__/         # Jest tests
│   │   ├── config/            # Database config
│   │   ├── controllers/       # Auth, User, Tenant controllers
│   │   ├── middleware/        # Auth, tenant isolation, rate limiter
│   │   ├── models/            # User, Tenant models
│   │   ├── routes/            # Multi-tenant API routes
│   │   ├── utils/             # JWT utilities
│   │   └── server.ts
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/        # UI components (Project 2)
│   │   ├── contexts/          # Auth context
│   │   ├── pages/             # Login, Register, Dashboard
│   │   ├── services/          # API services
│   │   └── App.tsx
│   └── package.json
└── README.md
```

## Testing

```bash
cd backend
npm test              # Run all tests
npm run test:watch    # Watch mode
```

**Coverage:** Backend unit & integration tests with tenant isolation validation

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

## Roadmap

**Project 2: Branded UI Library** (In Progress)
- [ ] Accessible component library (WCAG 2.1 AA)
- [ ] Dynamic tenant theming system
- [ ] Tenant-branded login/registration pages
- [ ] Admin branding configuration UI

**Project 3: Comprehensive Testing**
- [ ] Frontend component tests (Vitest + jest-axe)
- [ ] E2E tests with Playwright
- [ ] Security & tenant isolation tests
- [ ] 80%+ test coverage

**Project 4: AWS Deployment & Monitoring**
- [ ] Docker containerization
- [ ] AWS infrastructure (EC2, RDS, S3, CloudWatch)
- [ ] CI/CD pipeline with GitHub Actions
- [ ] Production monitoring & logging

## License

MIT

## Author

**Majid Seifi Kashani**

- Website: [seifi.dev](https://seifi.dev)
- LinkedIn: [linkedin.com/in/majidseifi](https://linkedin.com/in/majidseifi)
- Email: majid@seifi.dev
