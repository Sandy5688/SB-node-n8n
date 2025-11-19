import { Express, Request, Response } from 'express';
import { internalAuth } from '../middleware/internalAuth';

export function registerAuthRoutes(app: Express): void {
  app.post('/auth/login', async (_req: Request, res: Response) => {
    res.status(501).json({ error: { message: 'Not implemented' } });
  });
  app.post('/auth/logout', internalAuth, async (_req: Request, res: Response) => {
    res.status(501).json({ error: { message: 'Not implemented' } });
  });
  app.get('/auth/me', internalAuth, async (_req: Request, res: Response) => {
    res.status(501).json({ error: { message: 'Not implemented' } });
  });
}


