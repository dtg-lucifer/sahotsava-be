# Sahotsava Backend API

Production-ready Express backend with PostgreSQL, Redis, and comprehensive
security features.

## Features

- 🔒 **Security First**: Helmet, rate limiting, CORS, input validation
- 🗃️ **Database**: PostgreSQL with Prisma ORM
- ⚡ **Cache**: Redis integration
- 📝 **Logging**: Winston for structured logging
- 🔄 **Graceful Shutdown**: Proper cleanup of resources
- 🚀 **Production Ready**: Environment validation, error handling

## Getting Started

### Prerequisites

- Bun runtime
- PostgreSQL database
- Redis server (optional)

### Installation

1. Clone the repository
2. Install dependencies:

```bash
bun install
```

3. Copy environment file:

```bash
cp .env.example .env
```

4. Configure your `.env` file with actual values

5. Generate Prisma client:

```bash
bun run prisma:generate
```

6. Run database migrations:

```bash
bun run prisma:migrate
```

## Development

To start the development server:

```bash
bun run dev
```

The server will start on `http://localhost:8998` (or your configured PORT).

## Environment Variables

Required environment variables:

- `PORT` - Server port (default: 8998)
- `HOST` - Server host (default: 0.0.0.0)
- `DATABASE_URL` - PostgreSQL connection string
- `ALLOWED_ORIGINS` - Comma-separated list of allowed CORS origins
- `REDIS_URL` - Redis connection string (optional)

See `.env.example` for detailed configuration.

## Security Features

This application includes production-grade security features:

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Helmet**: Security headers protection
- **CORS**: Configurable origin whitelist
- **Request Size Limits**: 10MB max payload
- **Environment Validation**: Required variables checked at startup
- **Database Connection Pooling**: Optimized connections

For detailed security documentation, see [SECURITY.md](./SECURITY.md).

## API Documentation

### Health Check

```bash
GET /api/v1/health
```

Returns server health status.

## Scripts

- `bun run dev` - Start development server with hot reload
- `bun run prisma:generate` - Generate Prisma client
- `bun run prisma:migrate` - Run database migrations
- `bun run prisma:studio` - Open Prisma Studio

## Project Structure

```
src/
├── index.ts           # Application entry point
├── server.ts          # Server class with configuration
├── middlewares/       # Express middlewares
│   ├── logger.ts      # Winston logging
│   └── request_id.ts  # Request ID tracking
├── routes/            # API routes
│   ├── health.ts      # Health check endpoint
│   └── admin/         # Admin routes
├── services/          # Business logic
└── utils/             # Utility functions
    ├── cache.ts       # Redis cache wrapper
    └── shutdown_handler.ts
```

## Production Deployment

Before deploying to production:

1. ✅ Update `ALLOWED_ORIGINS` with production URLs
2. ✅ Use strong database passwords
3. ✅ Enable SSL/TLS for database connections
4. ✅ Set up HTTPS/TLS for the API
5. ✅ Configure monitoring and alerting
6. ✅ Review and adjust rate limits based on expected traffic
7. ✅ Set up automated backups
8. ✅ Run security audit: `bun audit`

## License

[Your License]

## Support

For security issues, see [SECURITY.md](./SECURITY.md).
