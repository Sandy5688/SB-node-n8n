import { Express, Request, Response } from 'express';
import { internalAuth } from '../middleware/internalAuth';

export function registerUserRoutes(app: Express): void {
  app.get('/user/:id', internalAuth, async (_req: Request, res: Response) => {
    res.status(501).json({ error: { message: 'Not implemented' } });
  });
  app.post('/user', internalAuth, async (_req: Request, res: Response) => {
    res.status(501).json({ error: { message: 'Not implemented' } });
  });
  app.patch('/user/:id', internalAuth, async (_req: Request, res: Response) => {
    res.status(501).json({ error: { message: 'Not implemented' } });
  });
}


