import { Express, Request, Response } from 'express';
import { sendAdminAlert } from '../services/alerts';
import { internalAuth } from '../middleware/internalAuth';

export function registerAlertRoutes(app: Express): void {
  app.post('/alert/admin', internalAuth, async (req: Request, res: Response) => {
    const { severity, message, context } = req.body || {};
    if (!severity || !message) {
      res.status(400).json({ error: { message: 'severity and message are required' } });
      return;
    }
    await sendAdminAlert({ severity, message, context });
    res.status(204).send();
  });
}


