import { Request, Response, NextFunction } from 'express';
import { getDb } from '../db/mongo';
import { auditLog } from '../services/audit';

const envBlocked = new Set(
  (process.env.BLOCKED_IPS_CSV || '')
    .split(',')
    .map(x => x.trim())
    .filter(Boolean)
);

export async function blockList(req: Request, res: Response, next: NextFunction): Promise<void> {
  const ip = req.ip || req.connection.remoteAddress || '';
  if (envBlocked.has(ip)) {
    void auditLog({
      action: 'blocked_ip',
      ip,
      path: req.path,
      correlationId: (req as any).correlationId,
      details: { source: 'env' }
    });
    res.status(403).json({ error: { message: 'Forbidden' } });
    return;
  }
  try {
    const db = await getDb();
    const found = await db.collection('blocked_ips').findOne({ ip });
    if (found) {
      void auditLog({
        action: 'blocked_ip',
        ip,
        path: req.path,
        correlationId: (req as any).correlationId,
        details: { source: 'db' }
      });
      res.status(403).json({ error: { message: 'Forbidden' } });
      return;
    }
  } catch {
    // If DB not available, continue rather than blocking all
  }
  next();
}


