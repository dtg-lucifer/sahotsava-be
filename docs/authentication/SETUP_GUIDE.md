# Authentication System - Environment Setup Guide

## Prerequisites

Before starting the authentication system, you need to configure several environment variables. This guide walks you through the setup process.

## Step 1: Email Configuration (Gmail)

### 1.1 Enable 2-Factor Authentication
1. Go to https://myaccount.google.com/security
2. Scroll to "2-Step Verification"
3. Click "Get Started" and follow the setup wizard
4. Confirm your identity via phone or security key

### 1.2 Create App Password
1. Go to https://myaccount.google.com/apppasswords
2. Select:
   - **App**: Mail
   - **Device**: Windows Computer (or your device)
3. Google will generate a 16-character password
4. Copy this password (it will only show once)

**Example**: `xxxx xxxx xxxx xxxx`

### 1.3 Update .env File
```bash
# Open the .env file in your project root
nano .env

# Add or update these lines:
EMAIL=your-gmail-address@gmail.com
APP_PASSWORD=xxxx xxxx xxxx xxxx
```

## Step 2: JWT Secret Configuration

Generate secure secrets for JWT signing:

```bash
# Option 1: Using OpenSSL (recommended)
openssl rand -base64 32

# Option 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Update `.env` with generated values:
```env
JWT_SECRET=your-generated-secret-key-here
JWT_REFRESH_SECRET=your-generated-refresh-secret-here
```

## Step 3: Application URL Configuration

Set the frontend URL that will be used in verification email links:

```env
# Development
APP_URL=http://localhost:3000

# Production (example)
APP_URL=https://sahotsava.example.com
```

## Step 4: Complete .env Setup

Here's a complete example of required authentication variables:

```env
# ============================================
# EMAIL CONFIGURATION
# ============================================
# Your Gmail address
EMAIL=your-email@gmail.com

# 16-character app password from Google Account
# Get it from: https://myaccount.google.com/apppasswords
APP_PASSWORD=xxxx xxxx xxxx xxxx

# ============================================
# FRONTEND CONFIGURATION
# ============================================
# URL where verification emails link to
# Used in email templates for verification links
APP_URL=http://localhost:3000

# ============================================
# JWT CONFIGURATION
# ============================================
# Secret key for signing access tokens (24h expiry)
# Generate with: openssl rand -base64 32
JWT_SECRET=your-secret-key-generate-with-openssl

# Secret key for signing refresh tokens (30d expiry)
# Generate with: openssl rand -base64 32
JWT_REFRESH_SECRET=your-refresh-secret-key-generate-with-openssl

# ============================================
# EXISTING DATABASE/SERVER CONFIG
# ============================================
# (Keep your existing configuration)
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
PORT=8989
HOST=localhost
```

## Step 5: Verify Configuration

### 5.1 Test Email Connection
```bash
# Run the server in development mode
bun run dev

# Check logs for email service connection
# Look for: "✓ Email service connected successfully"
```

### 5.2 Test API Endpoints
```bash
# Test signup endpoint
curl -X POST http://localhost:8989/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "password": "TestPassword123"
  }'

# Expected Response:
# {
#   "success": true,
#   "message": "User registered successfully...",
#   "data": { "user": {...} }
# }
```

## Troubleshooting

### "Could not resolve nodemailer"
```bash
# Install dependencies
bun install
```

### "EMAIL or APP_PASSWORD not configured"
1. Check `.env` file exists in project root
2. Verify `EMAIL` and `APP_PASSWORD` are set
3. Ensure no extra spaces in variable names
4. Restart server after changing `.env`

### "Gmail App Password not working"
1. Verify 2-Factor Authentication is enabled
2. Regenerate App Password (old ones may expire)
3. Ensure you're using the 16-character version without spaces
4. Check Gmail security hasn't locked the account

### "Email sending fails but server starts"
1. Check `logs/` directory for error messages
2. Verify email service connection in startup logs
3. Check Gmail's recent security activity
4. Ensure internet connection is active

### "Verification link doesn't work"
1. Check `APP_URL` is correct in `.env`
2. Verify frontend has verification page at `/verify-email?token=xxx`
3. Check Redis is running (tokens cached there)
4. Verify token hasn't expired (24-hour limit)

## Security Best Practices

### Development
```env
# Development secrets (acceptable for local development)
JWT_SECRET=dev-secret-key
JWT_REFRESH_SECRET=dev-refresh-secret
EMAIL=your-test-gmail@gmail.com
APP_PASSWORD=your-app-password
```

### Production
```env
# Production secrets (MUST be strong and random)
JWT_SECRET=<strong-random-string-32-chars>
JWT_REFRESH_SECRET=<strong-random-string-32-chars>
EMAIL=noreply@yourdomain.com
APP_PASSWORD=<secure-app-password>
APP_URL=https://yourdomain.com
```

### Never Commit Secrets
```bash
# .gitignore should include:
.env
.env.local
.env.*.local

# .env.example is for documentation only (no real secrets)
```

## Email Rate Limits

### Gmail Limits
- **Per day**: 500 emails (can increase with request)
- **Per minute**: ~15-30 emails
- **Quota reset**: Every 24 hours (UTC)

### For Production
Consider using:
- SendGrid (100K free emails/month)
- Mailgun (10K free emails/month)
- AWS SES (62K free emails/month)
- Brevo (300 free emails/day)

## Configuration Checklist

- [ ] Gmail account with 2FA enabled
- [ ] App Password generated and copied
- [ ] `.env` file created in project root
- [ ] EMAIL variable set
- [ ] APP_PASSWORD variable set
- [ ] APP_URL variable set correctly
- [ ] JWT_SECRET generated and set
- [ ] JWT_REFRESH_SECRET generated and set
- [ ] All required env vars (DATABASE_URL, REDIS_URL, etc.) configured
- [ ] Server starts without warnings
- [ ] Signup test endpoint works
- [ ] Verification email received
- [ ] Verification link works

## Next Steps

1. ✅ Complete environment configuration
2. Run `bun run dev` to start the server
3. Test signup endpoint
4. Check email for verification link
5. Click link to verify email
6. Login and receive JWT tokens
7. Use tokens to access protected routes

## Support

If you encounter issues:
1. Check logs in `logs/` directory
2. Review AUTHENTICATION.md for API details
3. Verify all environment variables are set
4. Ensure Gmail app password hasn't expired
5. Check internet connectivity

## References

- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [Nodemailer Configuration](https://nodemailer.com/)
- [JWT.io - JWT Debugger](https://jwt.io/)
- [Bun Runtime Documentation](https://bun.sh/docs)
