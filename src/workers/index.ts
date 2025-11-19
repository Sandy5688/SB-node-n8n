import { env } from '../config/env';
import { logger } from '../lib/logger';

async function start() {
  if (!env.ENABLE_WORKERS) {
    logger.info('Workers disabled via ENABLE_WORKERS flag; exiting.');
    process.exit(0);
    return;
  }
  logger.info('Workers started (no jobs configured yet).');
  // Add job processors here when queue backend is added.
  // Keep process alive:
  setInterval(() => {}, 1 << 30);
}

void start();


