import { env } from '../config/env';
import { logger } from '../lib/logger';

type BullQueue = any;

function loadBullMQ(): { Queue: any; Worker: any; QueueScheduler: any } | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('bullmq');
    return mod;
  } catch {
    return null;
  }
}

export function getQueue(name: string): BullQueue | null {
  if (!env.REDIS_URL) {
    logger.info('REDIS_URL not set; queue disabled');
    return null;
  }
  const bull = loadBullMQ();
  if (!bull) {
    logger.warn('bullmq not installed; queue disabled');
    return null;
  }
  const { Queue } = bull;
  const queue = new Queue(name, {
    connection: { url: env.REDIS_URL }
  });
  return queue;
}

export async function enqueueJob(queueName: string, data: Record<string, any>): Promise<{ ok: boolean; id?: string; reason?: string }> {
  const queue = getQueue(queueName);
  if (!queue) return { ok: true, reason: 'queue_disabled' };
  const job = await queue.add(queueName, data, { attempts: 3, backoff: { type: 'exponential', delay: 1000 } });
  return { ok: true, id: job.id };
}


