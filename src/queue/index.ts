import { logger } from '../lib/logger';
import { env } from '../config/env';
import { enqueueJob } from './processor';

export type EnqueueResult = { ok: boolean; queued?: boolean; reason?: string };

export async function enqueue(jobName: string, data: Record<string, any>): Promise<EnqueueResult> {
  if (!env.REDIS_URL || !env.ENABLE_WORKERS) {
    logger.info(`Queue disabled; skipping enqueue for job=${jobName}`);
    return { ok: true, queued: false, reason: 'queue_disabled' };
  }
  try {
    const res = await enqueueJob(jobName, data);
    return { ok: res.ok, queued: true };
  } catch (e: any) {
    logger.error(`Failed to enqueue job=${jobName}: ${e?.message}`);
    return { ok: false, queued: false, reason: 'enqueue_failed' };
  }
}


