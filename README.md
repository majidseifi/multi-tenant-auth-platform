# Multi-Tenant Authentication & IAM System

A production-ready authentication and identity access management system built with Node.js, Express, React, and TypeScript, featuring JWT-based authentication, role-based access control (RBAC), and comprehensive security measures.

## Features

- ✅ User registration & login with JWT
- ✅ Access & refresh token mechanism with unique token IDs (jti)
- ✅ Role-based access control (Admin, User, Viewer)
- ✅ Account lockout after 5 failed login attempts (15-minute lock)
- ✅ Rate limiting (5 requests/minute on auth endpoints)
- ✅ Password hashing with bcrypt (10 rounds)
- ✅ Protected routes with middleware
- ✅ CORS & security headers (Helmet)
- ✅ Comprehensive backend testing (Jest + Supertest)
- ✅ Automatic token refresh on frontend

## Tech Stack

**Backend:**

- Node.js + Express
- TypeScript
- PostgreSQL
- JWT + bcrypt
- Jest + Supertest (71% test coverage)

**Frontend:**

- React 18
- TypeScript
- Vite
- React Router v6
- Axios with interceptors
- Context API for state management

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (Railway/Supabase free tier)
- Git

### Installation

1. **Clone the repository:**

```bash
git clone https://github.com/majidseifi/multi-tenant-auth-platform.git
cd multi-tenant-auth-platform
```

2. **Setup backend:**

```bash
cd backend
npm install

# Create .env file
cp .env.example .env
# Edit .env with your database credentials and JWT secrets

# Run database schema
psql <your-database-url> -f src/config/schema.sql

# Start development server
npm run dev
```

3. **Setup frontend:**

```bash
cd ../frontend
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:5000/api" > .env

# Start development server
npm run dev
```

4. **Access the application:**

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Health check: http://localhost:5000/health

### Running Tests

```bash
cd backend
npm test              # Run all tests with coverage
npm run test:watch    # Run tests in watch mode
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user

  - Body: `{ email, password, first_name?, last_name? }`
  - Returns: `{ user, accessToken, refreshToken }`

- `POST /api/auth/login` - User login

  - Body: `{ email, password }`
  - Returns: `{ user, accessToken, refreshToken }`

- `POST /api/auth/refresh` - Refresh access token

  - Body: `{ refreshToken }`
  - Returns: `{ accessToken, refreshToken }`

- `POST /api/auth/logout` - Logout user

  - Headers: `Authorization: Bearer <token>`
  - Body: `{ refreshToken }`

- `GET /api/auth/me` - Get current user info
  - Headers: `Authorization: Bearer <token>`
  - Returns: User object

### Users (Admin only)

- `GET /api/users` - List all users

  - Query: `?limit=50&offset=0`
  - Requires: Admin role

- `PATCH /api/users/:userId/role` - Update user role
  - Body: `{ role: 'admin' | 'user' | 'viewer' }`
  - Requires: Admin role

## Environment Variables

### Backend (.env)

```env
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@host:port/database

# JWT Secrets (generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_ACCESS_SECRET=your_access_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# CORS
CORS_ORIGIN=http://localhost:5173
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:5000/api
```

## Security Features

- **Password Security**

  - Bcrypt hashing with 10 salt rounds
  - Minimum 8 characters requirement

- **Token Security**

  - JWT with separate access (15min) and refresh (7d) tokens
  - Unique token IDs (jti) using crypto.randomUUID()
  - Refresh token rotation on each refresh
  - Token storage in PostgreSQL for validation

- **Account Protection**

  - Account lockout after 5 failed attempts (15-minute lock)
  - Rate limiting: 5 requests/minute on auth endpoints
  - Failed attempt counter reset on successful login

- **API Security**

  - Helmet security headers
  - CORS configuration
  - SQL injection prevention (parameterized queries)
  - Input validation with express-validator

- **Frontend Security**
  - Automatic token refresh on 401 errors
  - Protected routes with authentication check
  - Tokens stored in localStorage (consider httpOnly cookies for production)

## Project Structure

```
auth-iam-system/
├── backend/
│   ├── src/
│   │   ├── __tests__/         # Jest tests
│   │   ├── config/            # Database & schema
│   │   ├── controllers/       # Route controllers
│   │   ├── middleware/        # Auth & rate limiter
│   │   ├── models/            # User model
│   │   ├── routes/            # Express routes
│   │   ├── utils/             # JWT service
│   │   └── server.ts          # Express app
│   ├── jest.config.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── contexts/          # Auth context
│   │   ├── pages/             # React pages
│   │   ├── services/          # API & auth services
│   │   └── App.tsx
│   └── package.json
└── README.md
```

## Testing

Current test coverage: **71.88%**

Tests cover:

- User registration (valid, duplicate email, validation)
- User login (valid, invalid password, non-existent user)
- Token refresh mechanism
- Protected routes (with/without token)
- Logout functionality

## Database Schema

**Users Table:**

- Authentication data (email, password_hash)
- Profile (first_name, last_name)
- Security (role, is_active, failed_login_attempts, locked_until)
- Verification (email_verified)

**Refresh Tokens Table:**

- Token storage with expiration
- User association
- Automatic cleanup on logout

See `backend/src/config/schema.sql` for complete schema.

## Known Issues & Solutions

1. **Role not showing on dashboard refresh**

   - Fixed: Added `role` field to `/auth/me` endpoint response

2. **Tests failing with duplicate tokens**

   - Fixed: Added unique `jti` (JWT ID) to all tokens using crypto.randomUUID()

3. **Jest localStorage error**
   - Fixed: Using jsdom test environment with TextEncoder polyfill

## Future Enhancements

- [ ] OAuth 2.0 authorization server (Authorization Code Flow)
- [ ] Email verification with verification tokens
- [ ] Password reset flow with email
- [ ] Two-factor authentication (TOTP)
- [ ] Session management UI
- [ ] Audit logs for security events
- [ ] Admin dashboard for user management
- [ ] Docker containerization
- [ ] CI/CD pipeline

## Deployment

**Backend (Railway):**

1. Push to GitHub
2. Connect Railway to repository
3. Add environment variables
4. Deploy PostgreSQL plugin
5. Deploy backend service

**Frontend (Vercel):**

1. Push to GitHub
2. Import project in Vercel
3. Add VITE_API_URL environment variable
4. Deploy

## License

MIT

## Author

**Majid Seifi Kashani**

- Website: [seifi.dev](https://seifi.dev)
- LinkedIn: [linkedin.com/in/majidseifi](https://linkedin.com/in/majidseifi)
- Email: majid@seifi.dev
