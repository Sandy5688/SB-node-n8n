import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { correlationId } from './middleware/correlationId';
import { errorHandler } from './middleware/errorHandler';
import { registerWebhookRoutes } from './api/webhook';
import { registerVerifyRoutes } from './api/verify';
import { registerOtpRoutes } from './api/otp';
import { registerMessagingRoutes } from './api/messaging';
import { registerStorageRoutes } from './api/storage';
import { registerAlertRoutes } from './api/alert';
import { registerHealthRoutes } from './api/health';
import { registerMetricsRoutes, httpRequestCounter } from './api/metrics';
import { logger } from './lib/logger';
import { getDb } from './db/mongo';

const app = express();

// Global middleware (ensure /webhook/entry runs BEFORE JSON parsing to preserve raw body)
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(correlationId);

// Request metrics
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const route = req.route?.path || req.path;
    httpRequestCounter.inc({ method: req.method, route, status: String(res.statusCode) });
    const duration = Date.now() - start;
    logger.info(JSON.stringify({ msg: 'request_done', method: req.method, path: req.path, status: res.statusCode, durationMs: duration, correlationId: (req as any).correlationId }));
  });
  next();
});

// Register webhook route (uses raw body)
registerWebhookRoutes(app);

// JSON parsing for remaining routes
app.use(express.json({ limit: '2mb' }));

// Register remaining routes
registerVerifyRoutes(app);
registerOtpRoutes(app);
registerMessagingRoutes(app);
registerStorageRoutes(app);
registerAlertRoutes(app);
registerHealthRoutes(app);
registerMetricsRoutes(app);

// 404 handler
app.use((_req, res) => res.status(404).json({ error: { message: 'Not Found' } }));

// Error handler
app.use(errorHandler);

const port = Number(process.env.PORT || 3000);

async function start() {
  try {
    await getDb();
  } catch (e: any) {
    logger.error(`Database connection failed: ${e?.message}`);
    process.exit(1);
  }
  app.listen(port, () => {
    logger.info(`Server listening on port ${port}`);
  });
}

void start();


