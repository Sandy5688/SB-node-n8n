import { z } from 'zod';
import validator from 'validator';
import { toE164OrNull } from '../../lib/e164';

export const basicPayloadSchema = z.object({
  source: z.string().min(1),
  type: z.string().min(1),
  timestamp: z.union([z.number(), z.string()]).optional(),
  user: z
    .object({
      user_id: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional()
    })
    .optional(),
  data: z.record(z.any()).optional()
});

export type BasicPayload = z.infer<typeof basicPayloadSchema>;

export function normalizeBasicPayload(payload: BasicPayload): BasicPayload {
  const normalized: BasicPayload = { ...payload };
  if (payload.user?.email) {
    const email = String(payload.user.email).trim().toLowerCase();
    normalized.user = { ...(normalized.user || {}), email };
  }
  if (payload.user?.phone) {
    const e164 = toE164OrNull(String(payload.user.phone));
    if (e164) {
      normalized.user = { ...(normalized.user || {}), phone: e164 };
    } else {
      // If invalid, drop phone to avoid propagating bad data
      normalized.user = { ...(normalized.user || {}) };
      delete (normalized.user as any).phone;
    }
  }

  if (payload.data) {
    // Example normalization for monetary fields if present
    for (const [k, v] of Object.entries(payload.data)) {
      if (k.toLowerCase().includes('email') && typeof v === 'string') {
        (payload.data as any)[k] = validator.normalizeEmail(v) || v.toLowerCase();
      }
    }
  }

  return normalized;
}


