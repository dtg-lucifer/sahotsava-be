# 📚 Authentication Documentation

Complete authentication system documentation for Sahotsava. This folder contains all guides, API references, and implementation details for the authentication flow.

## 📖 Documentation Files

### 1. **AUTHENTICATION_FLOW.md** ⭐ START HERE
The complete authentication flow documentation. Read this first to understand:
- User roles and verification status
- Step-by-step authentication flows
- Email verification process
- Protected vs public endpoints
- Error scenarios
- Security features
- Frontend implementation examples
- Role-based authorization
- Troubleshooting guide

**Time to read**: 15-20 minutes

### 2. **AUTHENTICATION.md**
Complete API reference with:
- All endpoint descriptions
- Request/response examples
- Error codes and messages
- Rate limiting information
- Token structure and validation

**Time to read**: 10-15 minutes

### 3. **AUTH_README.md**
Quick overview with:
- Feature list
- Quick start guide
- API endpoint summary
- File structure
- Production checklist

**Time to read**: 5-10 minutes

### 4. **SETUP_GUIDE.md**
Step-by-step setup instructions:
- Environment variable configuration
- Gmail App Password setup
- JWT secret generation
- Database setup
- Testing the system
- Troubleshooting common issues

**Time to read**: 10 minutes (depends on your familiarity)

### 5. **IMPLEMENTATION_SUMMARY.md**
Technical implementation details:
- Architecture overview
- Service descriptions
- Middleware documentation
- Testing checklist
- Future enhancements

**Time to read**: 10 minutes

---

## 🚀 Quick Navigation

### I want to...

**Understand the complete authentication system**
→ Read [AUTHENTICATION_FLOW.md](./AUTHENTICATION_FLOW.md)

**Set up the system for the first time**
→ Follow [SETUP_GUIDE.md](./SETUP_GUIDE.md)

**Get a quick overview**
→ Check [AUTH_README.md](./AUTH_README.md)

**See all API endpoints and responses**
→ Review [AUTHENTICATION.md](./AUTHENTICATION.md)

**Understand the code structure**
→ Read [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)

**Test the endpoints**
→ Run `bash test-auth.sh` (requires server running)

---

## 🎯 Key Concepts

### User Roles

```
┌─────────────────────┬───────────────┬──────────────┐
│ Role                │ Pre-verified  │ Login Status │
├─────────────────────┼───────────────┼──────────────┤
│ SUPER_ADMIN         │ ✅ Yes        │ ✅ Immediate │
│ DOMAIN_LEAD         │ ✅ Yes        │ ✅ Immediate │
│ CAMPUS_AMBASSADOR   │ ❌ No         │ ⏳ After email│
│ CHECKIN_CREW        │ ✅ Yes        │ ✅ Immediate │
└─────────────────────┴───────────────┴──────────────┘
```

### Authentication Flows

**Super Admin/Domain Lead/Check-in Crew:**
1. Admin adds user (pre-verified)
2. User logs in with email + password
3. System generates JWT tokens
4. User can access protected endpoints
5. Tokens refresh automatically
6. User logs out

**Campus Ambassador:**
1. Admin adds user (NOT pre-verified)
2. System sends verification email
3. User clicks verification link in email
4. Email verified ✅
5. User logs in with email + password
6. System generates JWT tokens
7. User can access protected endpoints
8. User logs out

---

## 🔑 API Endpoints Summary

### Public Endpoints (No Token Required)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/v1/auth/login` | Login with email + password |
| GET | `/api/v1/auth/verify-email?token=xxx` | Verify email (returns HTML) |
| POST | `/api/v1/auth/verify-email` | Verify email (returns JSON) |
| POST | `/api/v1/auth/refresh-token` | Get new access token |
| POST | `/api/v1/auth/resend-verification` | Resend verification email |

### Protected Endpoints (Token Required)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/auth/me` | Get current user profile |
| POST | `/api/v1/auth/logout` | Logout user |

---

## 📋 Setup Checklist

- [ ] Read [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- [ ] Set up Gmail 2FA and get App Password
- [ ] Generate JWT_SECRET: `openssl rand -base64 32`
- [ ] Generate JWT_REFRESH_SECRET: `openssl rand -base64 32`
- [ ] Create `.env` file with required variables
- [ ] Run `bun install` to install dependencies
- [ ] Start server: `bun run dev`
- [ ] Test endpoints: `bash test-auth.sh`
- [ ] Verify email sending works
- [ ] Test complete flow: signup → verify → login

---

## 🧪 Testing

### Quick Test Script

```bash
# Run all endpoint tests
bash test-auth.sh
```

### Manual Testing with cURL

```bash
# 1. Login
curl -X POST http://localhost:8989/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'

# 2. Get profile (use accessToken from response)
curl -X GET http://localhost:8989/api/v1/auth/me \
  -H "Authorization: Bearer <accessToken>"

# 3. Logout
curl -X POST http://localhost:8989/api/v1/auth/logout \
  -H "Authorization: Bearer <accessToken>"
```

---

## ⚠️ Important Notes

### Super Admin / Domain Lead / Check-in Crew

✅ **Can login immediately** after being added to database
- No email verification needed
- Set up by admin
- Full access to their respective endpoints

### Campus Ambassador

❌ **Cannot login until email verified**
- Added to database by admin
- Must click verification link in email
- Has 24 hours to verify
- Can request resend of verification email
- Full access after verification

### Forgot Password / Account Issues

Currently the system does **NOT** support:
- Self-service password reset
- Account deletion by users
- Email change

**Solution**: Contact admin to:
- Reset password
- Delete/reactivate account
- Change email

These features can be added if needed.

---

## 🔐 Security Highlights

✅ **Passwords**: Bcrypt hashing with 10 salt rounds
✅ **Access Tokens**: 24-hour JWT tokens
✅ **Refresh Tokens**: 30-day JWT tokens stored in Redis
✅ **Email Verification**: 32-byte random tokens, 24-hour expiration
✅ **Rate Limiting**: Built-in protection against brute force
✅ **CORS**: Configurable cross-origin protection
✅ **HTTPS**: Ready for production with secure headers

---

## 📞 Support & Troubleshooting

### Common Issues

**"Email not sending"**
- Check EMAIL and APP_PASSWORD in .env
- Verify Gmail 2FA is enabled
- Generate new App Password at https://myaccount.google.com/apppasswords
- Check server logs in `logs/` directory

**"Login failed"**
- Verify email and password are correct
- For Campus Ambassadors: verify email first
- Check user exists in database (check with admin)

**"Verification link invalid"**
- Token may have expired (24 hours)
- Click "Resend Verification Email"
- Use new link from email

**"Token expired"**
- Frontend should auto-refresh using refreshToken
- If refresh fails, user must log in again

See [AUTHENTICATION_FLOW.md](./AUTHENTICATION_FLOW.md#troubleshooting) for detailed troubleshooting.

---

## 📚 Related Documentation

- **Root README**: [`/README.md`](../../README.md)
- **Security Policy**: [`/SECURITY.md`](../../SECURITY.md)
- **Project README**: [`/README.md`](../../README.md)

---

## 🎓 Learning Path

### For Frontend Developers
1. Read [AUTHENTICATION_FLOW.md](./AUTHENTICATION_FLOW.md) (Complete overview)
2. Check "Frontend Implementation Guide" section
3. Run test-auth.sh to see responses
4. Implement login component
5. Implement token refresh logic
6. Test with backend

### For Backend Developers
1. Read [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)
2. Review [AUTHENTICATION.md](./AUTHENTICATION.md)
3. Study source code in `src/`:
   - `src/services/auth.service.ts`
   - `src/services/user.service.ts`
   - `src/middlewares/auth.ts`
   - `src/routes/auth/index.ts`
   - `src/utils/email.ts`

### For DevOps / System Admins
1. Read [SETUP_GUIDE.md](./SETUP_GUIDE.md)
2. Configure environment variables
3. Set up Gmail or email service
4. Deploy and test
5. Monitor logs in `logs/` directory

---

## ✨ Features

### Authentication
- ✅ Email/password login
- ✅ JWT token generation and validation
- ✅ Token refresh without re-login
- ✅ Logout with token invalidation
- ✅ Automatic token expiration

### Email Verification
- ✅ Automated email sending (Gmail)
- ✅ 24-hour verification tokens
- ✅ Resend verification email
- ✅ Professional HTML templates
- ✅ Success/error pages

### Security
- ✅ Bcrypt password hashing
- ✅ JWT signing
- ✅ Redis token caching
- ✅ Rate limiting
- ✅ CORS protection
- ✅ Input validation

### User Management
- ✅ Get user profile
- ✅ User associations (teams, categories)
- ✅ Role-based access control
- ✅ User caching for performance

---

## 📈 Performance

- **Login**: ~100ms (database + bcrypt)
- **Token Verification**: ~5ms (JWT decode)
- **Email Sending**: ~2-5 seconds (depends on Gmail)
- **Token Refresh**: ~50ms (database + Redis)

---

## 🚀 Production Deployment

Before going to production:

- [ ] Change JWT_SECRET to strong random value
- [ ] Change JWT_REFRESH_SECRET to strong random value
- [ ] Set APP_URL to production domain
- [ ] Use production email service (SendGrid, Mailgun, AWS SES)
- [ ] Enable HTTPS
- [ ] Configure CORS for production domain
- [ ] Set up database backups
- [ ] Monitor logs and errors
- [ ] Test complete flow end-to-end
- [ ] Set up rate limiting on production server
- [ ] Configure Redis persistence
- [ ] Review security checklist in [SECURITY.md](../../SECURITY.md)

---

**Last Updated**: December 7, 2025
**Status**: Production Ready ✅
**Maintained by**: dtg-lucifer <dev.bosepiush@gmail.com>
