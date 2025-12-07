# 🔐 Sahotsava Authentication Flow

Complete documentation of the authentication flow for different user roles and scenarios.

## Overview

This document describes the complete authentication flow for the Sahotsava system. Users are pre-added to the database by administrators with specific roles:
- **SUPER_ADMIN** - Pre-verified, full system access
- **DOMAIN_LEAD** - Pre-verified, domain management access
- **CAMPUS_AMBASSADOR** - NOT pre-verified, must verify email themselves
- **CHECKIN_CREW** - Pre-verified, check-in only access

## User Roles and Verification Status

### Super Admins & Domain Leads
- **Added by**: System administrator
- **Verification Status**: Pre-verified (is_verified = true)
- **Password**: Set by administrator or generated
- **Can immediately**: Log in and access all protected endpoints
- **No need to**: Verify email

### Campus Ambassadors
- **Added by**: System administrator
- **Verification Status**: NOT verified (is_verified = false)
- **Password**: Set by administrator
- **Must do first**: Verify email via link sent to them
- **After verification**: Can log in and access protected endpoints
- **Can request**: New verification email anytime

### Check-in Crew
- **Added by**: Campus ambassador or admin
- **Verification Status**: Pre-verified (is_verified = true)
- **Password**: Set by administrator
- **Can immediately**: Log in and access check-in endpoints

---

## Authentication Flows

### Flow 1: Super Admin / Domain Lead / Check-in Crew Login

**Status**: Already verified ✅

```
┌─────────────────────────────────────────────────────────────────┐
│ SUPER ADMIN / DOMAIN LEAD / CHECKIN CREW LOGIN FLOW             │
└─────────────────────────────────────────────────────────────────┘

Step 1: User opens frontend
   └─> User is on login page
       └─> User has email and password (set by admin)

Step 2: User submits login credentials
   └─> POST /api/v1/auth/login
   └─> Body: { email, password }

Step 3: Server validates credentials
   ├─> Check if email exists in database
   ├─> Check if password matches (bcrypt comparison)
   ├─> Get user details and role
   └─> Verify is_verified = true

Step 4: Generate tokens
   ├─> Access Token (JWT)
   │   ├─ Payload: { id, email, role }
   │   ├─ Expiration: 24 hours
   │   └─ Signed with JWT_SECRET
   │
   └─> Refresh Token (JWT)
       ├─ Payload: { id, email }
       ├─ Expiration: 30 days
       ├─ Signed with JWT_REFRESH_SECRET
       └─ Stored in Redis cache

Step 5: Send response
   └─> Response: {
         user: { id, email, name, role, is_verified: true },
         accessToken: "jwt-token",
         refreshToken: "jwt-refresh-token"
       }

Step 6: Frontend stores tokens
   ├─> Access Token → Memory or Local Storage
   └─> Refresh Token → HTTP-Only Cookie (secure)

Step 7: User accesses protected endpoint
   └─> GET /api/v1/auth/me
   └─> Header: Authorization: Bearer {accessToken}

Step 8: Server authenticates request
   ├─> Extract token from Authorization header
   ├─> Verify token signature using JWT_SECRET
   ├─> Check token expiration
   └─> Get user ID from decoded token

Step 9: Return protected resource
   └─> Response: { user: { id, email, name, role, ... } }

┌──────────────────────────────┐
│ ✅ User Authenticated        │
│ Can access all endpoints     │
└──────────────────────────────┘
```

### Flow 2: Campus Ambassador Registration & Email Verification

**Status**: Added to database but NOT verified ❌

#### Part A: User Receives Verification Email

```
┌─────────────────────────────────────────────────────────────────┐
│ CAMPUS AMBASSADOR RECEIVES VERIFICATION EMAIL                   │
└─────────────────────────────────────────────────────────────────┘

Step 1: Admin creates Campus Ambassador user
   └─> Database record created with:
       ├─ email: ambassador@example.com
       ├─ password: (hashed)
       ├─ is_verified: false
       ├─ role: CAMPUS_AMBASSADOR
       └─ verification_token: <random 32-byte token>

Step 2: Email service sends verification email
   └─> EmailService.sendVerificationEmail()
   └─> Email contains:
       ├─ Greeting with user's name
       ├─ Verification link:
       │  └─ {APP_URL}/verify-email?token={verification_token}
       ├─ Token expiration notice (24 hours)
       ├─ Instructions to click link
       └─ Support contact info

Step 3: Campus Ambassador receives email
   └─> Email arrives in inbox
       └─> "Please verify your email to access Sahotsava"

┌──────────────────────────────┐
│ 📧 Awaiting Email Click      │
│ User has 24 hours            │
└──────────────────────────────┘
```

#### Part B: Campus Ambassador Verifies Email

**Timeline**: User has 24 hours to click verification link

```
┌─────────────────────────────────────────────────────────────────┐
│ CAMPUS AMBASSADOR VERIFIES EMAIL                                │
└─────────────────────────────────────────────────────────────────┘

Step 1: User clicks verification link in email
   └─> Redirect to: {APP_URL}/verify-email?token=xxx
   └─> Frontend extracts token from URL

Step 2: Frontend sends verification request
   └─> GET /api/v1/auth/verify-email?token={token}
       OR
       POST /api/v1/auth/verify-email with { token }

Step 3: Server validates token
   ├─> Check if token exists in database
   ├─> Check if token hasn't expired (24 hours)
   ├─> Find associated user
   └─> Verify user hasn't already verified

Step 4: Update user in database
   ├─> Set is_verified = true
   ├─> Clear verification_token (set to null)
   ├─> Delete token from Redis cache
   └─> Update updatedAt timestamp

Step 5: Return verification response
   └─> Response (JSON): {
         user: {
           id, email, name, role,
           is_verified: true
         },
         message: "Email verified successfully"
       }
       OR
       Response (HTML): Success page with:
       ├─ Animated checkmark
       ├─ Success message
       ├─ Login instructions
       └─ Link to login page

Step 6: Frontend/User can now login
   └─> Redirect to login page
   └─> User can now log in with email + password

┌──────────────────────────────┐
│ ✅ Email Verified            │
│ Can now log in               │
└──────────────────────────────┘
```

#### Part C: What if User Misses Email?

```
┌─────────────────────────────────────────────────────────────────┐
│ RESEND VERIFICATION EMAIL                                       │
└─────────────────────────────────────────────────────────────────┘

Step 1: User notices no email or missed it
   └─> User goes to resend page in frontend

Step 2: User submits email address
   └─> POST /api/v1/auth/resend-verification
   └─> Body: { email }

Step 3: Server processes resend request
   ├─> Find user by email
   ├─> Check if already verified
   │  └─> If verified: Return "Already verified" message
   ├─> Generate new verification token
   └─> Delete old token from Redis

Step 4: Send new verification email
   └─> EmailService.sendVerificationEmail()
   └─> Same email as before with new token
   └─> Token valid for 24 hours

Step 5: Return response
   └─> Response: "Verification email sent successfully"

Step 6: User receives new email
   └─> Same process as Part B
   └─> User clicks new verification link

┌──────────────────────────────┐
│ 📧 Email Resent (24h valid)  │
│ User can verify anytime      │
└──────────────────────────────┘
```

#### Part D: What if Token Expires?

```
Token Expiration Timeline:
─────────────────────────

Generated: 2024-12-07 10:00 AM
Expiration: 2024-12-08 10:00 AM (24 hours later)

If user tries to verify AFTER 2024-12-08 10:00 AM:
├─> Verification fails
├─> Message: "Token has expired"
├─> Server returns 400 error
└─> User must request resend

User Actions:
├─> Click "Resend Verification Email"
├─> System generates new 24-hour token
└─> User gets new verification link in email
```

---

## Full User Journey Examples

### Example 1: Super Admin First Login

```
Admin Setup:
─────────────
1. User created by system with:
   - email: admin@sahotsava.com
   - password: (hashed)
   - role: SUPER_ADMIN
   - is_verified: true ✅

User Journey:
─────────────
1. Goes to login page
2. Enters: admin@sahotsava.com + password
3. POST /api/v1/auth/login → Receives accessToken + refreshToken
4. Frontend stores tokens
5. User clicks "Dashboard"
6. GET /api/v1/auth/me with Bearer token
7. Response includes user profile
8. Can access all admin endpoints
9. After 24h: Access token expires
10. Frontend uses refreshToken → POST /api/v1/auth/refresh-token
11. Gets new accessToken, continues working
12. After 30d: Refresh token expires → Must log in again
13. Clicks logout → POST /api/v1/auth/logout
14. Refresh token invalidated in Redis
15. User redirected to login page
```

### Example 2: Campus Ambassador Verification Journey

```
Day 1 - Admin Setup:
─────────────────────
1. Admin adds user: CA_user@example.com
   - is_verified: false ❌
   - verification_token: generated
2. System sends verification email

Day 1 - User Receives Email:
──────────────────────────
1. Email arrives at 11:00 AM
2. Contains link: {APP_URL}/verify-email?token=abc123

Day 3 - User Clicks Link (Finally!):
─────────────────────────────────────
1. User opens email on their phone
2. Clicks verification link
3. Frontend extracts token: abc123
4. Sends: GET /api/v1/auth/verify-email?token=abc123
5. Server verifies:
   ✅ Token exists in DB
   ✅ Token not expired (Token was valid 48h, still good)
   ✅ User not already verified
6. Updates user: is_verified = true, token cleared
7. Shows success page with:
   - "Email verified!"
   - "You can now log in"
   - Link to login page

Day 3 - User Logs In:
──────────────────────
1. Redirects to login page
2. Enters email + password
3. POST /api/v1/auth/login
4. Server checks:
   ✅ User exists
   ✅ Password matches
   ✅ is_verified = true
5. Generates accessToken + refreshToken
6. User can now access protected endpoints

Day 25 - User Still Has Refresh Token:
────────────────────────────────────────
1. User hasn't logged out in 25 days
2. Access token expired after 24h
3. But refresh token still valid (30 days total)
4. Frontend automatically refreshes:
   - POST /api/v1/auth/refresh-token
   - With old refreshToken
5. Gets new accessToken
6. User never interrupted, session continues
```

---

## Protected vs Public Endpoints

### Public Endpoints (No Authentication Required)

```
1. POST /api/v1/auth/login
   └─> No token needed
   └─> Anyone can attempt login
   └─> Returns token on success

2. GET /api/v1/auth/verify-email
   └─> No token needed
   └─> Anyone with token can verify
   └─> Returns HTML verification page

3. POST /api/v1/auth/verify-email
   └─> No token needed
   └─> Anyone with token can verify
   └─> Returns JSON response

4. POST /api/v1/auth/refresh-token
   └─> No Bearer token needed
   └─> Needs refreshToken in body
   └─> Returns new accessToken

5. POST /api/v1/auth/resend-verification
   └─> No token needed
   └─> Anyone can resend to their email
   └─> Server checks rate limiting
```

### Protected Endpoints (Authentication Required)

```
1. GET /api/v1/auth/me
   └─> Requires: Authorization: Bearer {accessToken}
   └─> Returns: Current user profile
   └─> Access Level: Any authenticated user

2. POST /api/v1/auth/logout
   └─> Requires: Authorization: Bearer {accessToken}
   └─> Invalidates: RefreshToken in Redis
   └─> Returns: Success message
   └─> Access Level: Any authenticated user

3. Any other API endpoints
   └─> Require: Bearer token
   └─> Role checks: May require specific role
   └─> Example: /api/v1/admin/users (requires SUPER_ADMIN)
```

---

## Error Scenarios

### Scenario 1: Wrong Password

```
User Action: POST /api/v1/auth/login
Body: {
  email: "user@example.com",
  password: "wrongPassword"
}

Server Response: 401 Unauthorized
{
  "status": "error",
  "message": "Invalid email or password",
  "statusCode": 401
}

User Action: Can try again immediately (rate limiting after 10 attempts)
```

### Scenario 2: Unverified Campus Ambassador

```
User Status: is_verified = false

User Action: POST /api/v1/auth/login
Body: {
  email: "ambassador@example.com",
  password: "correctPassword"
}

Server Response: 401 Unauthorized
{
  "status": "error",
  "message": "Invalid email or password",
  "statusCode": 401
}

Reason: Server rejects login for unverified users

User Action: Must verify email first
1. Request resend: POST /api/v1/auth/resend-verification
2. Click link in email
3. Then login
```

### Scenario 3: Expired Access Token

```
User Status: accessToken expired (after 24h)

User Action: GET /api/v1/auth/me
Header: Authorization: Bearer {expiredToken}

Server Response: 401 Unauthorized
{
  "status": "error",
  "message": "Token has expired",
  "statusCode": 401
}

User Action: Frontend should automatically:
1. Detect 401 response
2. Call: POST /api/v1/auth/refresh-token
3. With: { refreshToken }
4. Get new accessToken
5. Retry original request
```

### Scenario 4: Expired Verification Token

```
Token Generated: 2024-12-07 10:00 AM
Token Expires: 2024-12-08 10:00 AM

User Action: 2024-12-09 15:00 (too late!)
GET /api/v1/auth/verify-email?token={oldToken}

Server Response: 400 Bad Request
{
  "status": "error",
  "message": "Invalid or expired verification token",
  "statusCode": 400
}

User Action: Click "Resend Verification Email"
1. POST /api/v1/auth/resend-verification
2. System generates new 24-hour token
3. User receives new email with new link
4. Can verify again
```

---

## Security Features

### Token Security

```
Access Token (Bearer Token):
├─ Type: JWT (JSON Web Token)
├─ Duration: 24 hours
├─ Signed with: JWT_SECRET
├─ Contains: { id, email, role, iat, exp }
├─ Transmitted: Authorization header
├─ Storage: Memory or sessionStorage (NOT localStorage)
└─ Validation: Signature + Expiration checked on every request

Refresh Token:
├─ Type: JWT (JSON Web Token)
├─ Duration: 30 days
├─ Signed with: JWT_REFRESH_SECRET (different from access)
├─ Contains: { id, iat, exp }
├─ Transmitted: HTTP request body (NOT header)
├─ Storage: HTTP-Only Cookie (secure, not accessible to JS)
├─ Validation: Signature + Expiration + Redis cache check
└─ Invalidation: Cleared from Redis on logout
```

### Verification Token Security

```
Email Verification Token:
├─ Type: Random 32-byte string (cryptographically secure)
├─ Duration: 24 hours
├─ Storage: Database + Redis cache
├─ Format: Non-guessable (256-bit entropy)
├─ Transmitted: URL query parameter
├─ Validation:
│  ├─ Token exists in database
│  ├─ Associated user found
│  ├─ Token not expired
│  ├─ User not already verified
│  └─ One-time use only
└─ Invalidation: Deleted after successful verification
```

### Password Security

```
Password Hashing:
├─ Algorithm: Bcrypt
├─ Cost Factor: 10 salt rounds
├─ Comparison: Constant-time comparison
├─ Storage: Never stored in logs
├─ Requirements: Minimum 8 characters (enforced)
└─ Reset: Must be done by admin (not self-reset yet)
```

---

## Frontend Implementation Guide

### Step 1: Login Request

```javascript
async function login(email, password) {
  const response = await fetch('http://localhost:8989/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();

  if (response.ok) {
    // Store tokens
    sessionStorage.setItem('accessToken', data.data.accessToken);
    sessionStorage.setItem('refreshToken', data.data.refreshToken);

    return data.data;
  } else {
    throw new Error(data.message);
  }
}
```

### Step 2: Making Authenticated Requests

```javascript
async function getProfile() {
  const token = sessionStorage.getItem('accessToken');

  const response = await fetch('http://localhost:8989/api/v1/auth/me', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (response.status === 401) {
    // Token expired, refresh it
    await refreshAccessToken();
    // Retry request
    return getProfile();
  }

  return await response.json();
}
```

### Step 3: Token Refresh

```javascript
async function refreshAccessToken() {
  const refreshToken = sessionStorage.getItem('refreshToken');

  const response = await fetch(
    'http://localhost:8989/api/v1/auth/refresh-token',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    }
  );

  const data = await response.json();

  if (response.ok) {
    sessionStorage.setItem('accessToken', data.data.accessToken);
  } else {
    // Refresh failed, redirect to login
    window.location.href = '/login';
  }
}
```

### Step 4: Email Verification

```javascript
// User clicks link in email: {APP_URL}/verify-email?token=xxx

async function verifyEmail(token) {
  const response = await fetch(
    'http://localhost:8989/api/v1/auth/verify-email',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    }
  );

  const data = await response.json();

  if (response.ok) {
    // Show success message
    // Redirect to login
    window.location.href = '/login';
  } else {
    // Show error: token invalid or expired
    // Show resend button
  }
}
```

### Step 5: Resend Verification

```javascript
async function resendVerification(email) {
  const response = await fetch(
    'http://localhost:8989/api/v1/auth/resend-verification',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    }
  );

  const data = await response.json();

  if (response.ok) {
    // Show: "Check your email for verification link"
  } else {
    // Show error: "Failed to send email"
  }
}
```

---

## Role-Based Authorization

### Using Authorization Middleware

```typescript
// In your route file
import { authenticate, authorize } from '../../middlewares/auth';

// Super Admin only endpoint
router.post(
  '/admin/users',
  authenticate,
  authorize(['SUPER_ADMIN']),
  controller.createUser
);

// Super Admin OR Domain Lead
router.get(
  '/domain/users',
  authenticate,
  authorize(['SUPER_ADMIN', 'DOMAIN_LEAD']),
  controller.getDomainUsers
);

// Any authenticated user
router.get(
  '/profile',
  authenticate,
  controller.getProfile
);
```

---

## Troubleshooting

### Problem: "Email verification token invalid"
**Cause**: Token expired (24h) or already used

**Solution**:
1. Check current time vs token generation time
2. Request resend: POST /api/v1/auth/resend-verification
3. Use new verification link

### Problem: "Login failed - Invalid email or password"
**Causes**:
- Wrong password
- User not verified (for Campus Ambassadors)
- User email not in database
- User deleted/deactivated

**Solutions**:
1. Check email is correct
2. Check password is correct
3. If Campus Ambassador: verify email first
4. Contact admin if account not found

### Problem: "Authorization token expired"
**Cause**: Access token expired (after 24h)

**Solution**:
- Frontend should auto-refresh using refreshToken
- If refresh also fails, user must log in again

### Problem: "Email not sending"
**Causes**:
- Gmail App Password incorrect
- Gmail account doesn't have 2FA enabled
- Rate limited by Gmail
- EMAIL env var not set

**Solutions**:
1. Verify EMAIL and APP_PASSWORD in .env
2. Check Gmail account has 2FA enabled
3. Generate new App Password
4. Wait 1 hour if rate limited
5. For production: use SendGrid or Mailgun

---

## Summary Table

| Role | Added By | Pre-verified | Needs Email Verification | Can Login |
|------|----------|--------------|--------------------------|-----------|
| SUPER_ADMIN | Admin/System | ✅ Yes | ❌ No | ✅ Immediately |
| DOMAIN_LEAD | Admin/System | ✅ Yes | ❌ No | ✅ Immediately |
| CAMPUS_AMBASSADOR | Admin/System | ❌ No | ✅ Yes | ✅ After verification |
| CHECKIN_CREW | Ambassador/Admin | ✅ Yes | ❌ No | ✅ Immediately |

---

## Next Steps

1. **Setup Environment**: Follow [SETUP_GUIDE.md](./SETUP_GUIDE.md)
2. **API Reference**: See [AUTHENTICATION.md](./AUTHENTICATION.md)
3. **Quick Start**: Check [AUTH_README.md](./AUTH_README.md)
4. **Implementation Details**: Review [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)

---

**Last Updated**: December 7, 2025
**Status**: Production Ready ✅
**Maintained by**: dtg-lucifer <dev.bosepiush@gmail.com>
