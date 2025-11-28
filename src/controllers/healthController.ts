import { Request, Response } from 'express';
import { getDb } from '../db/mongo';
import { http } from '../lib/http';
import { env } from '../config/env';
import { logger } from '../lib/logger';
import Redis from 'ioredis';

let redisClient: Redis | null = null;

function getRedisClient(): Redis | null {
  if (!env.REDIS_URL) {
    return null;
  }
  
  if (!redisClient) {
    try {
      redisClient = new Redis(env.REDIS_URL, {
        maxRetriesPerRequest: 1,
        enableReadyCheck: true,
        lazyConnect: true,
      });
    } catch (err: any) {
      logger.warn(`Failed to create Redis client: ${err?.message}`);
      return null;
    }
  }
  
  return redisClient;
}

export async function healthCheckController(_req: Request, res: Response): Promise<void> {
  const out: any = { ok: true, checks: {} };
  
  // Check MongoDB
  try {
    const db = await getDb();
    await db.command({ ping: 1 });
    out.checks.db = 'ok';
  } catch (e: any) {
    out.ok = false;
    out.checks.db = `error: ${e?.message || 'unknown'}`;
  }
  
  // Check Redis (if configured) - use persistent client
  if (env.REDIS_URL) {
    try {
      const redis = getRedisClient();
      if (redis) {
        // Ensure connected (lazyConnect mode)
        if (!redis.status || redis.status !== 'ready') {
          await redis.connect();
        }
        const pong = await redis.ping();
        out.checks.redis = pong === 'PONG' ? 'ok' : `unexpected: ${pong}`;
        // Do not quit; keep client for future checks to avoid resource churn
      } else {
        out.checks.redis = 'client_init_failed';
      }
    } catch (e: any) {
      out.ok = false;
      out.checks.redis = `error: ${e?.message || 'unknown'}`;
      // Only reset client on error
      if (redisClient) {
        try {
          await redisClient.quit();
        } catch {}
        redisClient = null;
      }
    }
  } else {
    out.checks.redis = 'not_configured';
  }
  
  // Check n8n (optional)
  try {
    const url = env.N8N_INGEST_URL;
    if (url) {
      const result = await http.get(url, { validateStatus: () => true, timeout: 3000 });
      out.checks.n8n = `status:${result.status}`;
      if (result.status >= 500) out.ok = false;
    } else {
      out.checks.n8n = 'not_configured';
    }
  } catch (e: any) {
    out.ok = false;
    out.checks.n8n = `error: ${e?.message || 'unknown'}`;
  }
  
  res.status(out.ok ? 200 : 503).json(out);
}

