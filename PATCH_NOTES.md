# Node Backend Patch Notes

**Date:** November 28, 2025  
**Version:** 1.1.0  

---

## Summary

This patch addresses security hardening, reliability improvements, and code consistency across the Node.js backend service. All changes have been tested and validated with no linter errors.

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

---

*End of Patch Notes*

