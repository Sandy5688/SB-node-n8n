import { Express, Request, Response } from 'express';
import { internalAuth } from '../middleware/internalAuth';
import { isLikelyValidPaymentIntentId, requestRefund } from '../services/payments';
import { env } from '../config/env';

export function registerRefundRoutes(app: Express): void {
  if (!env.ENABLE_REFUNDS) return;

  app.post('/refunds/request', internalAuth, async (req: Request, res: Response) => {
    const { payment_intent_id, amount_cents } = req.body || {};
    if (!payment_intent_id || typeof payment_intent_id !== 'string') {
      res.status(422).json({ error: { message: 'payment_intent_id is required' } });
      return;
    }
    if (!isLikelyValidPaymentIntentId(payment_intent_id)) {
      res.status(422).json({ error: { message: 'Invalid payment_intent_id' } });
      return;
    }
    const amount = Number(amount_cents);
    if (!Number.isFinite(amount) || amount <= 0) {
      res.status(422).json({ error: { message: 'amount_cents must be a positive number' } });
      return;
    }
    const correlationId = (req as any).correlationId as string | undefined;
    const result = await requestRefund({ payment_intent_id, amount_cents: amount, correlationId });
    if (!result.ok) {
      res.status(500).json({ error: { message: result.error } });
      return;
    }
    const statusCode = result.status === 'pending_approval' ? 202 : 200;
    res.status(statusCode).json(result);
  });
}


