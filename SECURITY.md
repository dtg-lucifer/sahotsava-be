# Security Configuration Guide

This document outlines the security features implemented in the Sahotsava
Backend application.

## Security Features Implemented

### 1. Environment Variable Validation ✅

- **Location**: `src/server.ts` - `#validateEnvironment()` method
- **Purpose**: Ensures critical environment variables are present before server
  startup
- **Variables Validated**: `DATABASE_URL`, `PORT`, `HOST`
- **Impact**: Prevents runtime failures due to missing configuration

### 2. Rate Limiting ✅

- **Package**: `express-rate-limit`
- **Configuration**:
  - Window: 15 minutes
  - Max requests per IP: 100
  - Standard headers enabled
- **Protection Against**: DDoS attacks, brute force attempts, API abuse
- **Customization**: Adjust `windowMs` and `max` in `src/server.ts` based on
  your needs

### 3. Security Headers (Helmet) ✅

- **Package**: `helmet`
- **Features**:
  - Content Security Policy (CSP)
  - X-Frame-Options
  - X-Content-Type-Options
  - Strict-Transport-Security
  - X-Download-Options
  - X-Permitted-Cross-Domain-Policies
- **Protection Against**: XSS, clickjacking, MIME-sniffing attacks

### 4. CORS Configuration ✅

- **Environment Variable**: `ALLOWED_ORIGINS`
- **Format**: Comma-separated list of origins
- **Example**: `"http://localhost:3000,https://yourdomain.com"`
- **Features**:
  - Credentials support enabled
  - Specific methods allowed (GET, POST, PUT, DELETE, OPTIONS)
  - Custom headers: Content-Type, Authorization

### 5. Request Size Limits ✅

- **JSON Payload Limit**: 10MB
- **URL Encoded Limit**: 10MB
- **Purpose**: Prevents memory exhaustion from large payloads
- **Customization**: Adjust `limit` parameter in middleware setup

### 6. Database Connection Pooling ✅

- **Implementation**: Prisma Client with explicit datasource configuration
- **Features**:
  - Automatic connection management
  - Error and warning event logging
  - Graceful disconnection on shutdown
- **Benefits**: Better resource utilization, improved performance

## Additional Security Recommendations

### For Production Deployment:

1. **HTTPS/TLS**
   - Always use HTTPS in production
   - Update `ALLOWED_ORIGINS` with `https://` URLs
   - Consider using a reverse proxy (nginx/Caddy) for TLS termination

2. **Stricter Rate Limits**
   ```typescript
   // For authentication endpoints
   const authLimiter = rateLimit({
       windowMs: 15 * 60 * 1000,
       max: 5, // Only 5 requests per 15 minutes
   });
   app.use("/api/v1/auth", authLimiter);
   ```

3. **Environment-Specific Configuration**
   - Use different `.env` files for dev/staging/production
   - Never commit `.env` to version control
   - Use secrets management (AWS Secrets Manager, Vault, etc.)

4. **Input Validation**
   - Consider adding `express-validator` for request validation
   - Validate all user inputs before processing

5. **Logging and Monitoring**
   - Set up centralized logging (ELK stack, Datadog, etc.)
   - Monitor rate limit hits and suspicious patterns
   - Set up alerts for critical errors

6. **Database Security**
   - Use strong passwords for database users
   - Limit database user permissions (principle of least privilege)
   - Enable SSL/TLS for database connections in production
   - Regular backups and disaster recovery plan

7. **Dependencies**
   - Regularly update dependencies: `bun update`
   - Run security audits: `bun audit` or `npm audit`
   - Consider using Dependabot or Snyk for automated updates

8. **API Security**
   - Implement JWT token expiration
   - Use refresh token rotation
   - Add request signing for sensitive operations
   - Implement CSRF protection if using cookies

## Testing Security Features

### Test Rate Limiting:

```bash
# Send multiple requests quickly
for i in {1..110}; do
  curl http://localhost:8998/api/v1/health
done
# After 100 requests, you should get a 429 response
```

### Test CORS:

```bash
# From an unauthorized origin
curl -H "Origin: http://unauthorized.com" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS http://localhost:8998/api/v1/health
```

### Test Request Size Limit:

```bash
# Try sending a payload larger than 10MB
curl -X POST http://localhost:8998/api/v1/test \
     -H "Content-Type: application/json" \
     -d @large-file.json
```

## Emergency Response

If you detect a security issue:

1. **Immediate Actions**:
   - Check logs for suspicious patterns
   - Temporarily increase rate limits if under attack
   - Block malicious IPs at firewall/load balancer level

2. **Post-Incident**:
   - Review and update security policies
   - Patch vulnerabilities immediately
   - Notify affected users if data was compromised
   - Document the incident and response

## Contact

For security concerns or to report vulnerabilities, contact: [Your Security
Contact]

---

**Last Updated**: November 3, 2025 **Security Review**: Required every 3 months
