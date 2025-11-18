import { Express, Request, Response } from 'express';
import { upsertDocument } from '../services/storage';
import { internalAuth } from '../middleware/internalAuth';

export function registerStorageRoutes(app: Express): void {
  app.post('/services/storage/upsert', internalAuth, async (req: Request, res: Response) => {
    const { collection, match, update, options } = req.body || {};
    if (!collection || !match || !update) {
      res.status(400).json({ error: { message: 'collection, match, and update are required' } });
      return;
    }
    try {
      const result = await upsertDocument({ collection, match, update, options });
      res.json(result);
    } catch (e: any) {
      res.status(e?.status || 500).json({ error: { message: e?.message || 'Storage error' } });
    }
  });
}


