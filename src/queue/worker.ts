import { Worker, Job, ConnectionOptions } from 'bullmq';
import { env } from '../config/env';
import { logger } from '../lib/logger';
import { processOCR } from '../workers/ocrProcessor';
import { processMessagingRetry } from '../workers/messagingRetry';
import { processRefundExecute } from '../workers/refundExecutor';
import { processFlowExecute } from '../workers/flowExecutor';
import { processDailyCleanup } from '../workers/cleanupDaily';

const workers: Worker[] = [];

function getConnectionOptions(): ConnectionOptions {
  if (!env.REDIS_URL) {
    throw new Error('REDIS_URL not configured');
  }
  
  const url = new URL(env.REDIS_URL);
  return {
    host: url.hostname,
    port: parseInt(url.port || '6379', 10),
    password: url.password || undefined,
    db: url.pathname ? parseInt(url.pathname.slice(1), 10) : 0,
  };
}

type QueueName = 'ocr' | 'messaging_retry' | 'refund_execute' | 'flow_execute' | 'daily_cleanup';
type ProcessorFunction = (job: Job) => Promise<any>;

const processors: Record<QueueName, ProcessorFunction> = {
  ocr: processOCR,
  messaging_retry: processMessagingRetry,
  refund_execute: processRefundExecute,
  flow_execute: processFlowExecute,
  daily_cleanup: processDailyCleanup,
};

export async function startWorkers(): Promise<void> {
  if (!env.ENABLE_WORKERS || !env.REDIS_URL) {
    logger.info('Workers disabled (ENABLE_WORKERS=false or REDIS_URL not set)');
    return;
  }

  const connection = getConnectionOptions();
  const concurrency = env.QUEUE_CONCURRENCY;

  const queues: QueueName[] = ['ocr', 'messaging_retry', 'refund_execute', 'flow_execute', 'daily_cleanup'];

  for (const queueName of queues) {
    const processor = processors[queueName];
    
    const worker = new Worker(queueName, processor, {
      connection,
      concurrency,
      lockDuration: 30000, // 30 seconds
      limiter: {
        max: 100,
        duration: 1000, // 100 jobs per second max
      },
    });

    worker.on('completed', (job: Job) => {
      logger.info(`Job completed: queue=${queueName} id=${job.id} duration=${Date.now() - job.processedOn!}ms`);
    });

    worker.on('failed', (job: Job | undefined, err: Error) => {
      logger.error(`Job failed: queue=${queueName} id=${job?.id} error=${err.message} attempts=${job?.attemptsMade}`);
    });

    worker.on('error', (err: Error) => {
      logger.error(`Worker error: queue=${queueName} error=${err.message}`);
    });

    workers.push(worker);
    logger.info(`Worker started: queue=${queueName} concurrency=${concurrency}`);
  }

  logger.info(`All workers started (${workers.length} queues)`);
}

export async function stopWorkers(): Promise<void> {
  logger.info('Stopping workers...');
  
  for (const worker of workers) {
    try {
      await worker.close();
    } catch (err: any) {
      logger.warn(`Failed to close worker: ${err?.message}`);
    }
  }
  
  workers.length = 0;
  logger.info('All workers stopped');
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down workers gracefully');
  await stopWorkers();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down workers gracefully');
  await stopWorkers();
  process.exit(0);
});


