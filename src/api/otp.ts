import { Express, Request, Response } from 'express';
import { generateOtp, verifyOtp } from '../services/otp';
import { internalAuth } from '../middleware/internalAuth';
import { sendMessageWithFallback } from '../services/messaging';
import { env } from '../config/env';
import { logger } from '../lib/logger';

export function registerOtpRoutes(app: Express): void {
  app.post('/otp/generate', internalAuth, async (req: Request, res: Response) => {
    const { subject_type, subject_id } = req.body || {};
    if (!subject_type || !subject_id) {
      res.status(400).json({ error: { message: 'subject_type and subject_id are required' } });
      return;
    }
    const { otp_id, code } = await generateOtp({ subject_type, subject_id });
    // Never return code to the caller in production use-cases;
    // here we only return otp_id and mask the expectation that messaging will deliver the code.
    res.json({ otp_id });
    // Intentionally do not log the code.

    if (env.OTP_SEND_ON_GENERATE) {
      const to = String(req.body?.to || '').trim();
      const channel = String(req.body?.channel || '').trim();
      if (!to || !channel) {
        logger.warn('OTP_SEND_ON_GENERATE enabled but missing to/channel in request');
        return;
      }
      const correlationId = (req as any).correlationId as string | undefined;
      try {
        await sendMessageWithFallback({
          channel: channel as any,
          to,
          template_id: 'otp',
          params: { code },
          correlationId
        });
      } catch (e: any) {
        logger.error(`Failed to send OTP via messaging: ${e?.message}`);
      }
    }
  });

  app.post('/otp/verify', internalAuth, async (req: Request, res: Response) => {
    const { otp_id, code } = req.body || {};
    if (!otp_id || !code) {
      res.status(400).json({ error: { message: 'otp_id and code are required' } });
      return;
    }
    const result = await verifyOtp({ otp_id, code });
    res.json(result);
  });
}


