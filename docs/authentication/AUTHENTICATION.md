# Authentication System Documentation

## Overview

This document describes the complete authentication and email verification system for Sahotsava, supporting Super Admin, Domain Leads, Campus Ambassadors, and Check-in Crew roles.

## Features

- **User Registration**: Sign up with email, name, phone, and password
- **Email Verification**: Secure token-based email verification with HTML templates
- **Login System**: Authenticate with email and password
- **JWT Tokens**: Access tokens (24h) and refresh tokens (30d)
- **Role-Based Access Control**: Middleware for role-based authorization
- **Token Refresh**: Refresh expired access tokens without re-logging in
- **User Logout**: Invalidate refresh tokens
- **User Profile**: Get current user with associations (teams, categories)
- **Resend Verification**: Request new verification email

## Setup

### 1. Environment Variables

Add the following to your `.env` file:

```env
# Email Configuration
EMAIL=your-email@gmail.com
APP_PASSWORD=xxxx xxxx xxxx xxxx

# Application URL (used in verification links)
APP_URL=http://localhost:3000

# JWT Secrets (change in production)
JWT_SECRET=your-secret-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production
```

### 2. Gmail Setup (Recommended)

For sending emails via Gmail:

1. Enable 2-Factor Authentication on your Google Account
2. Generate an "App Password" at https://myaccount.google.com/apppasswords
3. Use the 16-character password in `APP_PASSWORD`

**Important**: Gmail has rate limits. For production, consider using a service like SendGrid, Mailgun, or AWS SES.

### 3. Install Dependencies

```bash
bun install
```

The following packages are already configured:
- `nodemailer` - Email sending
- `jsonwebtoken` - JWT token management
- `bcrypt` - Password hashing
- `redis` - Token caching
- `express` - HTTP framework

## API Endpoints

### Public Endpoints

#### 1. Sign Up
```
POST /api/v1/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "John Doe",
  "phone": "1234567890",
  "password": "securePassword123"
}

Response:
{
  "status": "success",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "CAMPUS_AMBASSADOR",
      "is_verified": false
    },
    "message": "User registered successfully. Check your email to verify your account."
  }
}
```

#### 2. Verify Email (GET)
```
GET /api/v1/auth/verify-email?token=<verification_token>

Response: HTML page with verification status
- Success: Shows animated success page with next steps
- Failed/Expired: Shows error page with instructions to resend
```

#### 3. Verify Email (JSON)
```
POST /api/v1/auth/verify-email
Content-Type: application/json

{
  "token": "<verification_token>"
}

Response:
{
  "status": "success",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "CAMPUS_AMBASSADOR",
      "is_verified": true
    },
    "message": "Email verified successfully"
  }
}
```

#### 4. Login
```
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}

Response:
{
  "status": "success",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "CAMPUS_AMBASSADOR",
      "is_verified": true
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### 5. Refresh Token
```
POST /api/v1/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "<refresh_token>"
}

Response:
{
  "status": "success",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### 6. Resend Verification Email
```
POST /api/v1/auth/resend-verification
Content-Type: application/json

{
  "email": "user@example.com"
}

Response:
- If user verified: HTML page showing already verified message
- If user unverified: JSON with success message
  {
    "status": "success",
    "data": {
      "message": "Verification email sent successfully"
    }
  }
```

### Protected Endpoints

#### 1. Get Current User Profile
```
GET /api/v1/auth/me
Authorization: Bearer <access_token>

Response:
{
  "status": "success",
  "data": {
    "user": {
      "id": "uuid",
      "uid": "CA_xxx",
      "name": "John Doe",
      "email": "user@example.com",
      "p_email": "user@example.com",
      "phone": "1234567890",
      "role": "CAMPUS_AMBASSADOR",
      "is_verified": true,
      "campus": {
        "id": "uuid",
        "uid": "CAM_xxx",
        "name": "Campus Name"
      },
      "user_teams": [
        {
          "team": {
            "id": "uuid",
            "uid": "TEAM_xxx",
            "name": "Team Name"
          }
        }
      ],
      "user_categories": [
        {
          "category": "DANCING_EVENTS"
        }
      ]
    }
  }
}
```

#### 2. Logout
```
POST /api/v1/auth/logout
Authorization: Bearer <access_token>

Response:
{
  "status": "success",
  "data": {
    "message": "Logged out successfully"
  }
}
```

## Email Templates

### Verification Email
- Professional HTML template with inline CSS
- Call-to-action button with verification link
- 24-hour expiration notice
- Fallback link for email clients that don't support buttons
- Branded footer with company info

### Success Page
- Animated checkmark icon
- Confirmation message
- Next steps instructions
- Professional gradient background
- Responsive design

### Already Verified Page
- Checkmark icon
- User-friendly message
- Information box
- Support contact information

### Expired/Invalid Link Page
- Warning icon
- Clear error message
- Instructions to request new verification
- Support contact information

## Authentication Flow Diagram

```
User Registration
       |
       v
Send Verification Email (with token)
       |
       v
User Clicks Link
       |
       v
Verify Email Endpoint
       |
       v
Email Marked as Verified
       |
       v
User Can Now Login
       |
       v
Login with Email/Password
       |
       v
Generate JWT Access Token + Refresh Token
       |
       v
Access Protected Resources
       |
       v (Token expires)
       |
Refresh Token Endpoint
       |
       v
Generate New Access Token
```

## Middleware Usage

### Authenticate Middleware
```typescript
import { authenticate } from "../middlewares/auth";

router.get("/protected-route", authenticate, (req, res) => {
  // req.user contains: { id, email, role }
  // req.token contains the JWT token
});
```

### Authorize Middleware
```typescript
import { authenticate, authorize } from "../middlewares/auth";

router.post(
  "/admin-only",
  authenticate,
  authorize(["SUPER_ADMIN", "DOMAIN_LEAD"]),
  (req, res) => {
    // Only SUPER_ADMIN or DOMAIN_LEAD can access
  }
);
```

### Optional Auth Middleware
```typescript
import { optionalAuth } from "../middlewares/auth";

router.get("/public-data", optionalAuth, (req, res) => {
  // req.user is set if valid token provided, undefined otherwise
});
```

## Token Management

### Access Token
- **Duration**: 24 hours
- **Use**: Authentication for API requests
- **Header**: `Authorization: Bearer <token>`
- **Scope**: Full access to protected resources based on role

### Refresh Token
- **Duration**: 30 days
- **Use**: Generate new access token when expired
- **Storage**: Cached in Redis
- **Scope**: Only used to request new access token

### Token Caching
- Access tokens are NOT cached (JWT is stateless)
- Refresh tokens are cached in Redis for validation
- On logout, refresh token is removed from cache
- Tokens are automatically expired at time of generation

## Security Best Practices

1. **Password Security**
   - Minimum 8 characters required
   - Hashed with bcrypt (10 rounds)
   - Never transmitted in logs

2. **Email Verification**
   - 32-byte random tokens
   - 24-hour expiration
   - One-time use only
   - Redis validation prevents token reuse

3. **JWT Security**
   - Signed with secret key (change in production)
   - Includes expiration claim
   - Verified on every protected request

4. **Rate Limiting**
   - 100 requests per 15 minutes per IP
   - Applies to all endpoints
   - Prevents brute-force attacks

5. **Environment Variables**
   - Never commit secrets to git
   - Use strong, unique secrets in production
   - Rotate secrets periodically

## Error Handling

All endpoints return consistent error responses:

```json
{
  "status": "error",
  "message": "Error description",
  "statusCode": 400
}
```

Common error codes:
- `400`: Bad Request (validation failed)
- `401`: Unauthorized (authentication required or failed)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `409`: Conflict (resource already exists)
- `500`: Internal Server Error

## Database Schema

### User Table
- `id`: UUID primary key
- `uid`: Unique identifier (e.g., CA_xxx)
- `email`: Unique email
- `p_email`: Primary email (for backup)
- `password`: Bcrypt hashed
- `verification_token`: Token for email verification
- `is_verified`: Email verification status
- `role`: User role (SUPER_ADMIN, DOMAIN_LEAD, CAMPUS_AMBASSADOR, CHECKIN_CREW)
- `phone`: Optional phone number
- `campusId`: Foreign key to Campus
- `createdAt`: Account creation timestamp
- `updatedAt`: Last update timestamp
- `deletedAt`: Soft delete timestamp (nullable)

## Testing

### Using curl
```bash
# Sign up
curl -X POST http://localhost:8989/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "password": "testPassword123"
  }'

# Login
curl -X POST http://localhost:8989/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testPassword123"
  }'

# Get profile (replace token)
curl -X GET http://localhost:8989/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Refresh token
curl -X POST http://localhost:8989/api/v1/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

## Troubleshooting

### Emails Not Sending
1. Check EMAIL and APP_PASSWORD in .env
2. Enable "Less secure app access" (if using Gmail)
3. Check spam folder for test emails
4. Verify internet connection to Gmail SMTP

### Verification Token Not Working
1. Check token hasn't expired (24 hours)
2. Verify token format is correct (32-byte hex)
3. Check Redis connection is active
4. Review logs for "Invalid or expired verification token"

### Login Failures
1. Verify email is registered
2. Check email is verified (is_verified = true)
3. Verify password is correct
4. Check no typos in credentials

### JWT Token Issues
1. Verify JWT_SECRET and JWT_REFRESH_SECRET are set
2. Check token hasn't expired
3. Verify Authorization header format: "Bearer TOKEN"
4. Check token matches the user's cached refresh token

## Future Enhancements

1. **OAuth Integration**: Google, GitHub, Microsoft sign-in
2. **Two-Factor Authentication**: SMS or authenticator app
3. **Password Reset**: Email-based password recovery
4. **Social Login**: Social provider integrations
5. **Token Invalidation**: Black-listing for early logout
6. **Email Templates**: Customizable templates per role
7. **Rate Limiting Per User**: Prevent abuse
8. **Audit Logging**: Track authentication events

## Support

For issues or questions:
1. Check the Troubleshooting section
2. Review the logs in `logs/` directory
3. Verify environment variables are correctly set
4. Check database and Redis connections

## License

This authentication system is part of Sahotsava and follows the same license.
