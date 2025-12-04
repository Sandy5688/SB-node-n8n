# Node Backend Patch Notes

**Date:** December 4, 2025  
**Version:** 2.0.0

---

## Summary

This major patch implements the complete Rokeeb n8n Node Patch List, covering 13 phases of security hardening, reliability improvements, and production readiness enhancements. All changes have been tested and validated with no linter errors.

---

## Patch List Implementation (December 4, 2025)

### Phase 1: Critical Security & Bug Fixes ✅

| Item | Status | File(s) |
|------|--------|---------|
| Fix HTTP validateStatus (200-300 only) | ✅ | `src/lib/http.ts` |
| Add future timestamp rejection | ✅ | `src/middleware/signature.ts` |
| Minimum secret length (32 chars) | ✅ | `src/config/env.ts` |
| JWT issuer check | ✅ | `src/middleware/internalAuth.ts` |
| Trust proxy setting | ✅ | `src/server.ts` |

### Phase 2: Signature & Idempotency Hardening ✅

| Item | Status | File(s) |
|------|--------|---------|
| Bind signature to endpoint path | ✅ | `src/middleware/signature.ts` |
| Raw body size limit (1MB) | ✅ | `src/api/webhook.ts` |
| IDEMPOTENCY_HASH_MISMATCH error code | ✅ | `src/middleware/idempotency.ts` |
| Add `_idempotent` replay flag | ✅ | `src/middleware/idempotency.ts` |
| Circular reference protection | ✅ | `src/lib/hmac.ts` |
| TTL enforcement in dedup insert | ✅ | `src/middleware/dedup.ts` |

### Phase 3: Worker & Queue Improvements ✅

| Item | Status | File(s) |
|------|--------|---------|
| Dead Letter Queues (DLQ) | ✅ | `src/queue/worker.ts` |
| Worker health tracking | ✅ | `src/queue/worker.ts` |
| Concurrency validation (1-50) | ✅ | `src/config/env.ts` |
| DLQ cleanup on shutdown | ✅ | `src/queue/worker.ts` |

### Phase 4: Messaging & OTP Improvements ✅

| Item | Status | File(s) |
|------|--------|---------|
| Retry jitter (50-150ms) | ✅ | `src/lib/http.ts`, `src/workers/messagingRetry.ts` |
| Correlation ID propagation | ✅ | `src/lib/http.ts`, `src/middleware/correlationId.ts` |

### Phase 5: N8N Integration Improvements ✅

| Item | Status | File(s) |
|------|--------|---------|
| Outbound signature headers | ✅ | `src/services/eventRouter.ts` |
| N8N retry policy (3 attempts + backoff) | ✅ | `src/services/eventRouter.ts` |

### Phase 6: Docker & PM2 Production Hardening ✅

| Item | Status | File(s) |
|------|--------|---------|
| Production Dockerfile | ✅ | `Dockerfile.prod` |
| PM2 gracefulShutdownTimeout | ✅ | `pm2.config.js` |
| PM2 scheduler process | ✅ | `pm2.config.js` |
| process.send('ready') for PM2 | ✅ | `src/server.ts` |
| Server graceful shutdown | ✅ | `src/server.ts` |

### Phase 7: Health System Enhancements ✅

| Item | Status | File(s) |
|------|--------|---------|
| Deep health mode (?deep=true) | ✅ | `src/controllers/healthController.ts` |
| Worker status in /health | ✅ | `src/controllers/healthController.ts` |
| Redis memory/persistence info | ✅ | `src/controllers/healthController.ts` |
| MongoDB stats in deep mode | ✅ | `src/controllers/healthController.ts` |

### Phase 8: Database & Index Improvements ✅

| Item | Status | File(s) |
|------|--------|---------|
| flow_executions indexes | ✅ | `src/db/indexes.ts`, `migrations/20241204000001-add-missing-indexes.js` |
| users.email unique sparse | ✅ | `src/db/indexes.ts`, `migrations/20241204000001-add-missing-indexes.js` |
| users.phone unique sparse | ✅ | `src/db/indexes.ts`, `migrations/20241204000001-add-missing-indexes.js` |
| audit_rate_limits TTL | ✅ | `src/db/indexes.ts` |

### Phase 9: Security Headers & CORS ✅

| Item | Status | File(s) |
|------|--------|---------|
| Helmet CSP configuration | ✅ | `src/server.ts` |
| HSTS headers | ✅ | `src/server.ts` |
| CORS origin restriction | ✅ | `src/server.ts` |
| CORS_ALLOWED_ORIGINS env var | ✅ | `src/config/env.ts`, `env.example` |

### Phase 10: Flow & Refund Worker Fixes ✅

| Item | Status | File(s) |
|------|--------|---------|
| Snake_case timestamps (started_at, etc.) | ✅ | `src/workers/flowExecutor.ts`, `src/workers/refundExecutor.ts` |
| Safe condition evaluator | ✅ | `src/workers/flowExecutor.ts` |
| Fix cleanupDaily field names | ✅ | `src/workers/cleanupDaily.ts` |

### Phase 11: Input Validation & Versioned Schemas ✅

| Item | Status | File(s) |
|------|--------|---------|
| payload_version field | ✅ | `src/schemas/payloads/basic.ts` |
| Response schema | ✅ | `src/schemas/payloads/basic.ts` |
| Helper functions | ✅ | `src/schemas/payloads/basic.ts` |

### Phase 12: Cleanup Jobs ✅

| Item | Status | Notes |
|------|--------|-------|
| TTL cleanups | ✅ | Already implemented in `cleanupDaily.ts` |

### Phase 13: IP Normalization ✅

| Item | Status | File(s) |
|------|--------|---------|
| IPv6 → IPv4 normalization | ✅ | `src/middleware/blockList.ts`, `src/middleware/signature.ts` |

---

## Breaking Changes

1. **Secret Length Requirements**: `HMAC_SECRET`, `JWT_SECRET`, and `N8N_TOKEN` now require minimum 32 characters
2. **Signature Binding**: Signatures now include the endpoint path - clients must update signature generation
3. **Timestamp Field Names**: Worker records now use snake_case (e.g., `started_at` instead of `startedAt`)
4. **JWT Issuer Required**: JWTs must include `iss: 'internal-backend'` claim

---

## New Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CORS_ALLOWED_ORIGINS` | Comma-separated allowed origins | (all allowed) |

---

## New Files

- `Dockerfile.prod` - Production-optimized multi-stage Dockerfile
- `migrations/20241204000001-add-missing-indexes.js` - Missing database indexes

---

## Previous Patch Notes (November 28, 2025)

---

## Changes Implemented

### 1. Signature Middleware Security Enhancement
**File:** `src/middleware/signature.ts`

**Changes:**
- Switched from direct `process.env.HMAC_SECRET` to validated `env.HMAC_SECRET` for runtime validation and consistent error handling
- Strengthened replay attack protection by including a hash of the raw request body in the replay guard key
- Previous key format: `sha256(timestamp:signature)`
- New key format: `sha256(timestamp:signature:bodyHash)`

**Impact:** Eliminates replay attack collisions where different request bodies could potentially share the same replay key.

---

### 2. Queue Job ID Propagation
**File:** `src/queue/index.ts`

**Changes:**
- Updated `EnqueueResult` type to include `id?: string` field
- The `enqueue()` function now properly forwards `id` and `reason` from the processor result
- Controllers can now access the job ID for tracking and logging purposes

**Impact:** Enables better job tracking and debugging capabilities across the system.

---

### 3. Graceful Worker Shutdown
**File:** `src/workers/index.ts`

**Changes:**
- Added proper signal handlers for `SIGTERM` and `SIGINT`
- Implements graceful shutdown sequence:
  1. Stop all BullMQ workers
  2. Close MongoDB connection
  3. Exit cleanly
- Removed the infinite `setInterval` keepalive in favor of proper process management

**Impact:** Ensures clean shutdown in Docker/Kubernetes environments, preventing data corruption and connection leaks.

---

### 4. Persistent Redis Health Check Client
**File:** `src/controllers/healthController.ts`

**Changes:**
- Redis client is now reused across health check requests instead of connect/quit per request
- Only reconnects if the client status is not "ready"
- Client is only reset on connection errors

**Impact:** Reduces resource churn and prevents health check flapping under frequent polling scenarios.

---

### 5. Explicit Boolean Environment Defaults
**File:** `src/config/env.ts`

**Changes:**
- Added explicit `.default('false')` for all boolean environment flags:
  - `OTP_SEND_ON_GENERATE`
  - `ENABLE_WORKERS`
  - `ENABLE_IDEMPOTENCY_MW`
  - `ENABLE_REFUNDS`

**Impact:** Prevents undefined boolean values at runtime; ensures predictable behavior when environment variables are not explicitly set.

---

### 6. Date Field Naming Normalization
**Files Modified:**
- `src/controllers/userController.ts`
- `src/workers/ocrProcessor.ts`
- `src/workers/messagingRetry.ts`
- `src/workers/refundExecutor.ts`
- `src/workers/cleanupDaily.ts`

**Changes:**
All date fields standardized to camelCase to match MongoDB index definitions:

| Old Field | New Field |
|-----------|-----------|
| `created_at` | `createdAt` |
| `updated_at` | `updatedAt` |
| `delivered_at` | `deliveredAt` |
| `completed_at` | `completedAt` |
| `started_at` | `startedAt` |
| `failed_at` | `failedAt` |
| `refunded_at` | `refundedAt` |
| `ocr_started_at` | `ocrStartedAt` |
| `ocr_completed_at` | `ocrCompletedAt` |
| `last_retry_at` | `lastRetryAt` |
| `last_error` | `lastError` |

**Impact:** Ensures TTL indexes and query indexes work correctly; eliminates field naming inconsistencies.

---

### 7. Enhanced Idempotency Tests
**File:** `tests/idempotency.test.ts`

**Changes:**
- Added test for JSON response truncation detection (>16KB)
- Added test for text response truncation handling
- Added test for unique hash generation across different requests
- Improved test organization with shared constants

**Impact:** Better test coverage for edge cases in the idempotency middleware.

---

## Verification Completed

| Check | Status |
|-------|--------|
| No duplicate module exports | ✅ Verified |
| No linter errors | ✅ Verified |
| Date fields match index definitions | ✅ Verified |
| All boolean flags have defaults | ✅ Verified |

---

## Files Modified

```
src/middleware/signature.ts
src/queue/index.ts
src/workers/index.ts
src/controllers/healthController.ts
src/config/env.ts
src/controllers/userController.ts
src/workers/ocrProcessor.ts
src/workers/messagingRetry.ts
src/workers/refundExecutor.ts
src/workers/cleanupDaily.ts
tests/idempotency.test.ts
```

---

## Recommendations for Testing

1. **Signature Verification:** Test webhook endpoints with valid signatures to ensure replay detection works correctly
2. **Worker Shutdown:** Test `docker stop` or `kill -SIGTERM` to verify graceful shutdown
3. **Health Endpoint:** Call `/health` multiple times rapidly to verify Redis client persistence
4. **Queue Jobs:** Verify job IDs are returned in controller responses where applicable

---

## No Changes Made To

- `src/lib/hmac.ts` - No changes needed (already correct)
- `openapi.yaml` - Optional enhancement (not in scope)
- `Dockerfile` / `docker-compose.yml` - No changes required
- `src/queue/processor.ts` - Already correctly structured
- `src/queue/worker.ts` - Already has proper shutdown handlers



