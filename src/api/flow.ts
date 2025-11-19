import { Express, Request, Response } from 'express';
import { internalAuth } from '../middleware/internalAuth';

export function registerFlowRoutes(app: Express): void {
  app.post('/flow/execute', internalAuth, async (_req: Request, res: Response) => {
    res.status(501).json({ error: { message: 'Not implemented' } });
  });
  app.get('/flow/:id/status', internalAuth, async (_req: Request, res: Response) => {
    res.status(501).json({ error: { message: 'Not implemented' } });
  });
}


