import { Express, Request, Response } from 'express';
import { generateOtp, verifyOtp } from '../services/otp';
import { internalAuth } from '../middleware/internalAuth';

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


