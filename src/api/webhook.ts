import { Express, Request, Response } from 'express';
import { verifyHmacSignature } from '../middleware/signature';
import { webhookRateLimiter } from '../middleware/rateLimit';
import { blockList } from '../middleware/blockList';
import { validateAndNormalizePayload } from '../middleware/validatePayload';
import { deduplicate } from '../middleware/dedup';
import { forwardToN8n } from '../services/eventRouter';
import { logger } from '../lib/logger';
import bodyParser from 'body-parser';

export function registerWebhookRoutes(app: Express): void {
  app.post(
    '/webhook/entry',
    bodyParser.raw({ type: '*/*' }),
    (req: Request, _res: Response, next) => {
      // Expose raw body for HMAC
      (req as any).rawBody = req.body as Buffer;
      next();
    },
    blockList,
    webhookRateLimiter(),
    verifyHmacSignature(),
    validateAndNormalizePayload,
    async (req: Request, res: Response, next) => {
      try {
        await deduplicate(req, res, next);
      } catch (e) {
        next(e);
      }
    },
    async (req: Request, res: Response) => {
      const internalEventId = (req as any).internal_event_id as string;
      const correlationId = (req as any).correlationId as string | undefined;
      const normalized = (req as any).normalizedPayload || {};
      const result = await forwardToN8n({
        payload: { ...normalized, internal_event_id: internalEventId },
        internalEventId,
        correlationId
      });
      if (!result.ok) {
        logger.error(`n8n forward failed status=${result.status}`);
      }
      res.status(200).json({ status: 'accepted', internal_event_id: internalEventId });
    }
  );
}


