# Events API Documentation

## Overview
CRUD operations for event management in the Sahotsava backend.

**Base URL**: `/api/v1/events`

**Service**: `src/services/event.service.ts`
**Routes**: `src/routes/events/index.ts`

---

## Endpoints

### 1. Get All Events
**GET** `/api/v1/events`

**Query Parameters**:
- `skip` (optional) - Number of records to skip for pagination
- `take` (optional) - Number of records to retrieve

**Response**:
```json
{
  "success": true,
  "message": "Events retrieved successfully",
  "data": {
    "events": [...],
    "count": 10
  },
  "statusCode": 200
}
```

**Cache**: 5 minutes

---

### 2. Get Event by ID
**GET** `/api/v1/events/id/:id`

**Parameters**:
- `id` (required) - Event UUID

**Response**:
```json
{
  "success": true,
  "message": "Event retrieved successfully",
  "data": {
    "event": {
      "id": "...",
      "slug": "...",
      "name": "...",
      "domain_lead": {...},
      "_count": {
        "registrations": 42,
        "tickets": 38
      }
    }
  },
  "statusCode": 200
}
```

**Cache**: 10 minutes

---

### 3. Get Event by Slug
**GET** `/api/v1/events/slug/:slug`

**Parameters**:
- `slug` (required) - Event slug (unique identifier)

**Response**: Same as Get Event by ID

**Cache**: 10 minutes

---

### 4. Search Events by Name
**GET** `/api/v1/events/search/name`

**Query Parameters**:
- `q` (required) - Search query (case-insensitive, partial match)

**Example**: `/api/v1/events/search/name?q=dance`

**Response**:
```json
{
  "success": true,
  "message": "Events search completed successfully",
  "data": {
    "events": [...],
    "count": 5,
    "query": "dance"
  },
  "statusCode": 200
}
```

**Cache**: 5 minutes

---

### 5. Search Events by Domain Lead
**GET** `/api/v1/events/search/domain-lead`

**Query Parameters**:
- `q` (required) - Domain lead name or email (case-insensitive, partial match)

**Example**: `/api/v1/events/search/domain-lead?q=john@example.com`

**Response**:
```json
{
  "success": true,
  "message": "Events retrieved successfully",
  "data": {
    "events": [...],
    "count": 3,
    "query": "john@example.com"
  },
  "statusCode": 200
}
```

**Cache**: 5 minutes

**Use Case**: Dashboard - filter events by domain lead

---

### 6. Get Events Ordered by Registrations (Dashboard)
**GET** `/api/v1/events/dashboard/registrations`

**Query Parameters**:
- `order` (optional) - Sort order: `asc` or `desc` (default: `desc`)
- `skip` (optional) - Number of records to skip for pagination
- `take` (optional) - Number of records to retrieve

**Example**: `/api/v1/events/dashboard/registrations?order=desc&take=10`

**Response**:
```json
{
  "success": true,
  "message": "Events retrieved successfully",
  "data": {
    "events": [...],
    "count": 10,
    "order": "desc"
  },
  "statusCode": 200
}
```

**Cache**: 3 minutes (shorter for dynamic dashboard data)

**Use Case**: Dashboard - show most popular events or events needing attention

---

## Event Data Structure

Each event object includes:
```typescript
{
  id: string;              // UUID
  slug: string;            // Unique slug
  name: string;            // Event name
  description: string;     // Event description
  thumb_url: string;       // Thumbnail URL
  max_registrations: number | null;
  date: DateTime;          // Event date
  domain_lead_id: string;  // Domain lead UUID
  domain_lead: {           // Populated domain lead info
    id: string;
    uid: string;
    name: string;
    email: string;
    role: string;
  };
  _count: {                // Aggregate counts
    registrations: number;
    tickets?: number;
  };
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

---

## Caching Strategy

**EventService** implements Redis caching with different TTLs:

| Query Type | Cache Key Pattern | TTL |
|-----------|-------------------|-----|
| All events | `events:all:{skip}:{take}` | 5 min |
| By ID | `event:id:{id}` | 10 min |
| By slug | `event:slug:{slug}` | 10 min |
| By name | `events:name:{name}` | 5 min |
| By domain lead | `events:lead:{identifier}` | 5 min |
| By registrations | `events:registrations:{order}:{skip}:{take}` | 3 min |

**Cache Invalidation**:
```typescript
// Invalidate specific event
await eventService.invalidateCache(eventId);

// Invalidate all event caches
await eventService.invalidateCache();
```

---

## Service Methods

All methods in `EventService`:

1. `getAllEvents(skip?, take?)` - Get all events with pagination
2. `getEventById(eventId)` - Get single event by UUID
3. `getEventBySlug(slug)` - Get single event by slug
4. `getEventsByName(name)` - Fuzzy search by name
5. `getEventsByDomainLead(identifier)` - Search by domain lead name/email
6. `getEventsByRegistrations(order, skip?, take?)` - Sort by registration count
7. `invalidateCache(eventId?)` - Clear event caches

All methods return `null` on error and log via Winston.

---

## Implementation Status

✅ **Completed**:
- Event service with all 6 query methods
- Routes with proper error handling
- Redis caching with different TTLs
- Type-safe interfaces for query parameters
- Standardized API responses
- Cache invalidation utilities

⏳ **Not Implemented** (intentionally left for future):
- Create event endpoint
- Update event endpoint
- Delete event endpoint
- Authentication/authorization middleware
- Input validation middleware
- Rate limiting for dashboard endpoints

---

## Testing

Example requests:

```bash
# Get all events
curl http://localhost:8989/api/v1/events

# Get event by ID
curl http://localhost:8989/api/v1/events/id/{uuid}

# Get event by slug
curl http://localhost:8989/api/v1/events/slug/dance-competition-2024

# Search by name
curl "http://localhost:8989/api/v1/events/search/name?q=dance"

# Search by domain lead
curl "http://localhost:8989/api/v1/events/search/domain-lead?q=john@example.com"

# Dashboard - top events by registrations
curl "http://localhost:8989/api/v1/events/dashboard/registrations?order=desc&take=10"
```

---

## Notes

- All endpoints are currently **public** (no authentication required)
- Dashboard endpoints are prefixed with `/dashboard/` for future middleware application
- Search queries are case-insensitive and support partial matching
- Pagination uses standard `skip` and `take` parameters
- All responses follow the standardized `api_response` format
