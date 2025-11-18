import { Express, Request, Response } from 'express';
import { getDb } from '../db/mongo';
import { http } from '../lib/http';

export function registerHealthRoutes(app: Express): void {
  app.get('/health', async (_req: Request, res: Response) => {
    const out: any = { ok: true, checks: {} };
    try {
      const db = await getDb();
      await db.command({ ping: 1 });
      out.checks.db = 'ok';
    } catch (e: any) {
      out.ok = false;
      out.checks.db = `error: ${e?.message || 'unknown'}`;
    }
    try {
      const url = process.env.N8N_INGEST_URL;
      if (url) {
        const result = await http.get(url, { validateStatus: () => true });
        out.checks.n8n = `status:${result.status}`;
        if (result.status >= 500) out.ok = false;
      } else {
        out.checks.n8n = 'not_configured';
      }
    } catch (e: any) {
      out.ok = false;
      out.checks.n8n = `error: ${e?.message || 'unknown'}`;
    }
    res.status(out.ok ? 200 : 503).json(out);
  });
}


