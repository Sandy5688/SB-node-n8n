import { Request, Response } from 'express';
import { forwardToN8n } from '../services/eventRouter';
import { logger } from '../lib/logger';

export async function handleWebhookEntry(req: Request, res: Response): Promise<void> {
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


