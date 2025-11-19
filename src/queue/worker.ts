import { env } from '../config/env';
import { logger } from '../lib/logger';

type Bull = { QueueScheduler: any; Worker: any };

function loadBullMQ(): Bull | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('bullmq');
    return mod;
  } catch {
    return null;
  }
}

export async function startWorkers(): Promise<void> {
  if (!env.ENABLE_WORKERS || !env.REDIS_URL) {
    logger.info('Workers disabled');
    return;
  }
  const bull = loadBullMQ();
  if (!bull) {
    logger.warn('bullmq not installed; workers disabled');
    return;
  }
  const { QueueScheduler, Worker } = bull;
  const connection = { url: env.REDIS_URL };
  const concurrency = env.QUEUE_CONCURRENCY;

  // Schedulers ensure delayed/retry jobs are handled
  const queues = ['ocr', 'flow_execute', 'messaging_retry', 'refund_execute', 'daily_cleanup'] as const;
  queues.forEach(name => {
    // eslint-disable-next-line no-new
    new QueueScheduler(name, { connection });
  });

  const processor = (name: string) => async (job: any) => {
    logger.info(`Processing job queue=${name} id=${job.id}`);
    switch (name) {
      case 'ocr':
        // OCR processor not implemented
        return { ok: true };
      case 'flow_execute':
        // Flow executor not implemented
        return { ok: true };
      case 'messaging_retry':
        // Messaging retry not implemented
        return { ok: true };
      case 'refund_execute':
        // Refund executor not implemented
        return { ok: true };
      case 'daily_cleanup':
        // Cleanup job not implemented
        return { ok: true };
      default:
        return { ok: false, reason: 'unknown_queue' };
    }
  };

  queues.forEach(name => {
    // eslint-disable-next-line no-new
    new Worker(name, processor(name), { connection, concurrency });
  });

  logger.info('Workers started');
}


