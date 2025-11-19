import { getDb } from '../db/mongo';
import { logger } from '../lib/logger';

type AuditEvent = {
  action: string;
  at?: Date;
  correlationId?: string;
  user_id?: string;
  ip?: string;
  path?: string;
  details?: Record<string, any>;
};

export async function auditLog(event: AuditEvent): Promise<void> {
  try {
    const db = await getDb();
    await db.collection('audit_logs').insertOne({
      ...event,
      at: event.at || new Date()
    });
  } catch (e: any) {
    logger.warn(`auditLog insert failed: ${e?.message}`);
  }
}


