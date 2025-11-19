import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly']).default('info'),

  HMAC_SECRET: z.string().min(1, 'HMAC_SECRET is required'),
  JWT_SECRET: z.string().optional(),
  RATE_LIMIT_PER_MINUTE: z.coerce.number().int().positive().optional(),
  INTERNAL_ALLOWLIST: z.string().optional(),
  BLOCKED_IPS_CSV: z.string().optional(),

  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),

  N8N_INGEST_URL: z.string().url().optional(),
  N8N_TOKEN: z.string().optional(),

  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_MESSAGING_SERVICE_SID: z.string().optional(),

  SENDGRID_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  ALERT_EMAIL_TO: z.string().email().optional(),

  SLACK_BOT_TOKEN: z.string().optional(),
  SLACK_ALERT_CHANNEL: z.string().optional(),

  OTP_SEND_ON_GENERATE: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
  REDIS_URL: z.string().optional(),
  ENABLE_WORKERS: z.enum(['true', 'false']).transform(v => v === 'true').optional(),

  ENABLE_REFUNDS: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
  REFUND_LIMIT_CENTS: z.coerce.number().int().positive().default(5000)
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const message = parsed.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
  throw new Error(`Invalid environment configuration: ${message}`);
}

export const env = parsed.data;


