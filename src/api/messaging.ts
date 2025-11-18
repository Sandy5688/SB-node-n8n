import { Express, Request, Response } from 'express';
import { sendMessageWithFallback } from '../services/messaging';
import { internalAuth } from '../middleware/internalAuth';

export function registerMessagingRoutes(app: Express): void {
  app.post('/services/messaging/send', internalAuth, async (req: Request, res: Response) => {
    const { channel, to, template_id, params, fallback } = req.body || {};
    if (!channel || !to || !template_id) {
      res.status(400).json({ error: { message: 'channel, to, and template_id are required' } });
      return;
    }
    const result = await sendMessageWithFallback({
      channel,
      to,
      template_id,
      params,
      fallback,
      correlationId: (req as any).correlationId
    });
    res.json(result);
  });
}


