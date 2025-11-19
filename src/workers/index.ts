import { env } from '../config/env';
import { logger } from '../lib/logger';
import { startWorkers } from '../queue/worker';

async function start() {
  if (!env.ENABLE_WORKERS) {
    logger.info('Workers disabled via ENABLE_WORKERS flag; exiting.');
    process.exit(0);
    return;
  }
  await startWorkers();
  // Keep process alive:
  // Keep process alive:
  setInterval(() => {}, 1 << 30);
}

void start();


