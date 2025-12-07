# 🔐 Sahotsava Authentication System

Complete, production-ready authentication system with email verification, JWT tokens, and role-based access control.

## 📋 Features

### Authentication
- ✅ User Registration with email validation
- ✅ Email verification with secure tokens
- ✅ Login with JWT generation
- ✅ Token refresh mechanism
- ✅ Logout with session invalidation
- ✅ Role-based access control (RBAC)

### Email System
- ✅ Professional HTML email templates
- ✅ Gmail SMTP integration
- ✅ Verification link with 24-hour expiration
- ✅ Success/failure pages with animations
- ✅ Resend verification emails

### Security
- ✅ Bcrypt password hashing
- ✅ JWT token signing
- ✅ Redis session management
- ✅ Rate limiting (100 req/15min per IP)
- ✅ CORS protection
- ✅ Helmet security headers
- ✅ Input validation
- ✅ SQL injection prevention (Prisma ORM)

### Developer Experience
- ✅ TypeScript with strict type checking
- ✅ Comprehensive documentation
- ✅ Test script included
- ✅ Structured error handling
- ✅ Request logging
- ✅ Industry-standard REST API

## 🚀 Quick Start

### 1. Install Dependencies
```bash
bun install
```

### 2. Configure Environment
```bash
# Copy example to .env
cp .env.example .env

# Edit .env with your values:
# - EMAIL: your gmail address
# - APP_PASSWORD: 16-char app password from Google
# - JWT_SECRET: random secret key
# - JWT_REFRESH_SECRET: random refresh secret
# - APP_URL: frontend URL
```

See `SETUP_GUIDE.md` for detailed setup instructions.

### 3. Start Server
```bash
bun run dev
```

Server will start on http://localhost:8989

### 4. Test Endpoints
```bash
# Signup
curl -X POST http://localhost:8989/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "name": "John Doe",
    "password": "SecurePassword123"
  }'

# Login
curl -X POST http://localhost:8989/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123"
  }'
```

## 📚 Documentation

- **[AUTHENTICATION.md](./AUTHENTICATION.md)** - Complete API reference
- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Environment configuration guide
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Technical overview

## 🎯 API Endpoints

### Public Endpoints

#### Register User
```
POST /api/v1/auth/signup
{
  "email": "user@example.com",
  "name": "John Doe",
  "phone": "1234567890",  // optional
  "password": "SecurePass123"
}
```

#### Verify Email
```
GET /api/v1/auth/verify-email?token=xxx
(Returns HTML page)

OR

POST /api/v1/auth/verify-email
{ "token": "xxx" }
(Returns JSON)
```

#### Login
```
POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

#### Refresh Token
```
POST /api/v1/auth/refresh-token
{ "refreshToken": "xxx" }
```

#### Resend Verification
```
POST /api/v1/auth/resend-verification
{ "email": "user@example.com" }
```

### Protected Endpoints (Require JWT)

#### Get Current User
```
GET /api/v1/auth/me
Authorization: Bearer <access_token>
```

#### Logout
```
POST /api/v1/auth/logout
Authorization: Bearer <access_token>
```

## 🔑 Environment Variables

### Required for Email
```env
EMAIL=your-gmail@gmail.com
APP_PASSWORD=xxxx xxxx xxxx xxxx
```

### Required for JWT
```env
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
```

### Required for URLs
```env
APP_URL=http://localhost:3000
```

See `.env.example` and `SETUP_GUIDE.md` for complete configuration.

## 📊 Role-Based Access Control

Supported roles:
- `SUPER_ADMIN` - Full system access
- `DOMAIN_LEAD` - Manage specific event domains
- `CAMPUS_AMBASSADOR` - Campus-level operations
- `CHECKIN_CREW` - Check-in only access

Protect routes with middleware:
```typescript
router.post(
  "/admin-only",
  authenticate,
  authorize(["SUPER_ADMIN", "DOMAIN_LEAD"]),
  handler
);
```

## 🔒 Security Features

### Password Security
- Minimum 8 characters
- Bcrypt hashing with 10 salt rounds
- Never logged or exposed

### Token Security
- Access tokens: 24-hour expiration
- Refresh tokens: 30-day expiration
- Signed with secret key
- Verified on every request
- Cached in Redis for session management

### Email Verification
- 32-byte random tokens
- 24-hour expiration
- One-time use only
- Redis-backed validation

### Rate Limiting
- 100 requests per 15 minutes per IP
- Global rate limiting on all routes
- Configurable per endpoint

## 🧪 Testing

### Run Test Script
```bash
chmod +x test-auth.sh
./test-auth.sh
```

### Manual Testing with cURL
```bash
# 1. Sign up
TOKEN=$(curl -s -X POST http://localhost:8989/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test",
    "password": "Test123456"
  }' | jq -r '.data.user.id')

# 2. Verify email (use token from email)
curl -X POST http://localhost:8989/api/v1/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"token": "token-from-email"}'

# 3. Login
LOGIN=$(curl -s -X POST http://localhost:8989/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456"
  }')

ACCESS_TOKEN=$(echo $LOGIN | jq -r '.data.accessToken')

# 4. Get Profile
curl -X GET http://localhost:8989/api/v1/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

## 📁 File Structure

```
src/
├── services/
│   ├── auth.service.ts       # Auth business logic
│   └── user.service.ts       # User management
├── routes/
│   └── auth/
│       └── index.ts          # Auth endpoints
├── middlewares/
│   ├── auth.ts               # JWT & RBAC middleware
│   └── index.ts              # Middleware exports
└── utils/
    ├── email.ts              # Email service & templates
    └── api_response.ts       # Response formatting

docs/
├── AUTHENTICATION.md         # Complete API reference
├── SETUP_GUIDE.md           # Setup instructions
└── IMPLEMENTATION_SUMMARY.md # Technical summary
```

## 🔄 Authentication Flow

```
┌─ User ─────────────────┐
│                        │
│  1. Signup            │
│  ↓                    │
│  Verification Email   │
│  ↓                    │
│  Verify Email         │
│  ↓                    │
│  Login                │
│  ↓                    │
│  Access Token + Refresh
│  ↓                    │
│  Protected API        │
│  ↓                    │
│  Token expires (24h)  │
│  ↓                    │
│  Refresh Token        │
│  ↓                    │
│  New Access Token     │
│  ↓                    │
│  Logout               │
│                        │
└────────────────────────┘
```

## 🐛 Troubleshooting

### Email Not Sending
1. Check EMAIL and APP_PASSWORD in .env
2. Verify 2FA is enabled on Gmail account
3. Regenerate App Password from https://myaccount.google.com/apppasswords
4. Check internet connection
5. Review logs in `logs/` directory

### Token Verification Failed
1. Check JWT_SECRET is set in .env
2. Verify token hasn't expired
3. Check Authorization header format: `Bearer TOKEN`
4. Ensure token is valid JWT format

### Login Not Working
1. Verify email is verified (is_verified = true)
2. Check email/password are correct
3. Ensure email exists in database
4. Check user role is not restricted

### Verification Link Invalid
1. Check token hasn't expired (24 hours)
2. Verify APP_URL is correct in .env
3. Check Redis connection is active
4. Review logs for token validation errors

See `SETUP_GUIDE.md` for more troubleshooting tips.

## 📝 Database Schema

User table includes:
- `id` - UUID primary key
- `uid` - Unique identifier (e.g., CA_xxx)
- `email` - User email (unique)
- `p_email` - Primary email (unique)
- `password` - Bcrypt hashed
- `verification_token` - Email verification token
- `is_verified` - Email verification status
- `role` - User role (enum)
- `phone` - Optional phone
- `campusId` - Campus reference
- `createdAt` - Creation timestamp
- `updatedAt` - Update timestamp
- `deletedAt` - Soft delete timestamp

## 🚀 Production Checklist

- [ ] Strong JWT_SECRET (32+ characters)
- [ ] Strong JWT_REFRESH_SECRET (32+ characters)
- [ ] Email configured with production email service
- [ ] APP_URL points to production domain
- [ ] CORS_ORIGINS configured for production
- [ ] HTTPS enabled (helmet configured)
- [ ] Rate limiting tested
- [ ] Logging enabled and monitored
- [ ] Email templates customized if needed
- [ ] Database backups configured
- [ ] Redis persistence configured
- [ ] Environment variables in secure vault
- [ ] Error handling tested thoroughly
- [ ] Load testing completed

## 🎓 Code Standards

- **Language**: TypeScript (strict mode)
- **Framework**: Express.js
- **Database**: Prisma ORM + PostgreSQL
- **Caching**: Redis
- **Email**: Nodemailer
- **Password Hashing**: Bcrypt
- **JWT**: jsonwebtoken
- **Logging**: Winston

## 🤝 Contributing

When extending the authentication system:

1. Follow TypeScript strict mode
2. Add comprehensive JSDoc comments
3. Include error handling
4. Add logging for important operations
5. Write tests for new endpoints
6. Update documentation

## 📄 License

This authentication system is part of Sahotsava project.

## 📞 Support

For issues, questions, or contributions:
1. Check the documentation files
2. Review logs in `logs/` directory
3. Run the test script
4. Verify environment configuration

---

**Version**: 1.0.0
**Last Updated**: December 7, 2025
**Status**: Production Ready ✅
