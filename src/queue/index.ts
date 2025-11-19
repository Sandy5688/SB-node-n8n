import { logger } from '../lib/logger';
import { env } from '../config/env';

export type EnqueueResult = { ok: boolean; queued?: boolean; reason?: string };

export async function enqueue(jobName: string, data: Record<string, any>): Promise<EnqueueResult> {
  if (!env.REDIS_URL || !env.ENABLE_WORKERS) {
    logger.info(`Queue disabled; skipping enqueue for job=${jobName}`);
    return { ok: true, queued: false, reason: 'queue_disabled' };
  }
  // Placeholder: integrate BullMQ or other queue here.
  logger.info(`Queue enabled but no backend configured; received job=${jobName}`);
  return { ok: true, queued: false, reason: 'backend_not_configured' };
}


