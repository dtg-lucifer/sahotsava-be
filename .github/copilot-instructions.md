# Sahotsava Backend - AI Coding Agent Instructions

## Project Overview

Event management system for Sahotsava festival with role-based access, pre-registered users, and Redis caching. Built with **Bun runtime** (not Node.js), Express 5.1, Prisma ORM, PostgreSQL, and Redis.

## Critical Architecture Patterns

### 1. **Dependency Injection via `res.locals`**

-   **Pattern**: Prisma and Redis clients are injected into `res.locals` by middleware, NOT passed as function params
-   **File**: `src/middlewares/dependency_injection.ts`
-   **Usage in routes**:

    ```typescript
    // ✅ Correct - access from res.locals
    const { prisma, redis } = res.locals;

    // ❌ Wrong - don't pass as function parameters
    router.get("/users", getUsersHandler(prisma, redis));
    ```

-   **Route factory pattern**: Routes are created via factory functions that receive dependencies:
    ```typescript
    export function createAuthRouter(
        prisma: PrismaClient,
        redis: RedisClientType,
    ): Router;
    ```

### 2. **Custom Password Utilities (NOT Raw Bcrypt)**

-   **File**: `src/lib/password.ts`
-   **ALWAYS use**: `hashPassword()`, `compareHashedPassword()`, `generatePassword()`
-   **NEVER use**: `bcrypt.hash()` or `bcrypt.compare()` directly
-   **Why**: Custom utilities ensure consistent password generation format (`{PREFIX}{FirstName}@{timestamp}`)
-   **Critical**: Seed script generates time-based passwords. Users MUST use credentials from `src/db/data/user_credentials.csv` (regenerated on each seed)

### 3. **Standardized API Responses**

-   **File**: `src/utils/api_response.ts`
-   **Pattern**: ALL route handlers MUST use `api_response.success()` or `api_response.error()`

    ```typescript
    // ✅ Correct
    const response = api_response.success(
        "Login successful",
        { user, accessToken },
        200,
    );
    return res.status(response.statusCode).json(response);

    // ❌ Wrong
    return res.json({ success: true, data: user });
    ```

### 4. **Prisma Client Generation Path**

-   **Generated to**: `src/generated/prisma/` (NOT default `node_modules/@prisma/client`)
-   **Import from**: `"../generated/prisma/client"` (relative paths)
-   **After schema changes**: Run `bun run prisma:generate` (not `prisma generate`)

## Development Workflow

### Database Operations (CRITICAL ORDER)

1. **Initial setup**: `make setup` (installs deps + generates Prisma client)
2. **Migrations**: `bun run prisma:migrate` (creates migration + applies)
3. **Seed database**: `bun run db:seed` (uses `src/db/seed.ts`)
4. **Clean slate**: `bun run db:deseed && bun run db:seed`
5. **Prisma Studio**: `bun run prisma:studio` (NOT `npx prisma studio`)

### Running the Server

-   **Development**: `make dev` or `bun run dev` (watch mode)
-   **Production**: `make all` or `bun run src/index.ts`
-   **Services**: `make db` (starts Docker Compose with PostgreSQL + Redis)

### Testing Authentication

-   **Script**: `docs/authentication/test-auth.sh`
-   **Credentials**: Check `src/db/data/user_credentials.csv` for current passwords
-   **Note**: Passwords regenerate on each seed (timestamp-based)

## Authentication System (NO SIGNUP)

### User Management Model

-   **No self-registration**: Users pre-added via seed script or admin
-   **Verification rules**:
    -   `SUPER_ADMIN`, `DOMAIN_LEAD`, `CHECKIN_CREW`: Auto-verified (`is_verified: true`)
    -   `CAMPUS_AMBASSADOR`: Must verify email themselves

### Auth Endpoints (7 total)

1. `POST /auth/login` - Login (public)
2. `GET /auth/verify-email?token=` - Email verification HTML (public)
3. `POST /auth/verify-email` - Email verification JSON (public)
4. `POST /auth/refresh-token` - Refresh access token (public)
5. `POST /auth/resend-verification` - Resend verification email (public)
6. `POST /auth/logout` - Logout (protected, requires `authenticate` middleware)
7. `GET /auth/me` - Get user profile (protected)

### Protected Routes Pattern

```typescript
import { authenticate, AuthRequest } from "../../middlewares/auth";

router.post(
    "/logout",
    authenticate,
    async (req: AuthRequest, res: Response) => {
        if (!req.user) {
            /* handle unauthorized */
        }
        // req.user contains { id, email, role }
    },
);
```

## Code Conventions

### File Headers

All service/route/middleware files include JSDoc maintainer:

```typescript
/**
 * {Description}
 * @maintainer dtg-lucifer <dev.bosepiush@gmail.com>
 */
```

### UID Generation

-   **Pattern**: Prefix-based unique IDs via `src/lib/uid.ts`
-   **Format**: `{PREFIX}{8-char-hex}` (e.g., `SA_A3F2B1C4`, `CAM_9D8E7F6A`)
-   **Prefixes**: `SA_` (Super Admin), `DL_` (Domain Lead), `CA_` (Campus Ambassador), `CC_` (Check-in Crew), `CAM_` (Campus), `TEAM_` (Team)

### Error Handling

-   Use `log.error()`, `log.warn()`, `log.info()` from `src/middlewares/logger.ts`
-   Throw `APIError` or `AuthError` from `src/utils/api_response.ts`
-   Always log before returning error responses

### Redis Caching Keys

-   Pattern: `{entity}:{identifier}` (e.g., `user:${userId}`, `refresh_token:${userId}`)
-   Verification tokens: `verification:${token}` (24hr TTL)
-   Refresh tokens: `refresh_token:${userId}` (30-day TTL)

## Environment Variables

**Required**:

-   `DATABASE_URL` - PostgreSQL connection string
-   `PORT` - Server port (default: 8989)
-   `HOST` - Server host (default: localhost)
-   `JWT_SECRET` - JWT signing secret
-   `REDIS_URL` - Redis connection (default: redis://localhost:6379)
-   `ALLOWED_ORIGINS` - Comma-separated CORS origins

**Email (Nodemailer)**:

-   `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASSWORD`, `APP_URL`

## Common Gotchas

1. **Bun vs Node**: Use `Bun.env` (not `process.env`) for environment variables
2. **JWT Type Casting**: Use `as jwt.SignOptions` when passing options to `jwt.sign()`
3. **Prisma PrismaPg Adapter**: Always use `@prisma/adapter-pg` for connection pooling
4. **Password Sync vs Async**: `compareHashedPassword()` is synchronous (uses `bcrypt.compareSync()`)
5. **Route Registration**: Auth routes use factory pattern: `auth_router(prisma, redis)`
6. **Makefile**: Targets use tabs (not spaces) - check `Makefile` before adding commands

## Documentation Structure

-   **Root README**: High-level overview, quick start
-   **docs/authentication/**: Complete auth system docs (7 files)
    -   `README.md` - Documentation hub
    -   `AUTHENTICATION_FLOW.md` - User journeys and flows
    -   `SETUP_GUIDE.md` - Environment setup
    -   `CHANGES_SUMMARY.md` - Recent architectural changes

## When Adding Features

1. **New routes**: Use factory pattern with DI (see `src/routes/auth/index.ts`)
2. **New services**: Create in `src/services/`, inject via `res.locals` or constructor
3. **New middleware**: Export from `src/middlewares/index.ts`
4. **Database changes**:
    - Edit `prisma/schema.prisma`
    - Run `bun run prisma:migrate`
    - Check `src/generated/prisma/` for updated types
5. **New endpoints**: Update relevant docs in `docs/authentication/`
