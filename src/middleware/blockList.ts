import { Request, Response, NextFunction } from 'express';
import { getDb } from '../db/mongo';

const envBlocked = new Set(
  (process.env.BLOCKED_IPS_CSV || '')
    .split(',')
    .map(x => x.trim())
    .filter(Boolean)
);

export async function blockList(req: Request, res: Response, next: NextFunction): Promise<void> {
  const ip = req.ip || req.connection.remoteAddress || '';
  if (envBlocked.has(ip)) {
    res.status(403).json({ error: { message: 'Forbidden' } });
    return;
  }
  try {
    const db = await getDb();
    const found = await db.collection('blocked_ips').findOne({ ip });
    if (found) {
      res.status(403).json({ error: { message: 'Forbidden' } });
      return;
    }
  } catch {
    // If DB not available, continue rather than blocking all
  }
  next();
}


