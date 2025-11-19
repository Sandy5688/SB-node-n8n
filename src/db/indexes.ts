import { Db } from 'mongodb';

export async function ensureIndexes(db: Db): Promise<void> {
  await db.collection('processed_events').createIndex(
    { internal_event_id: 1 },
    { unique: true, name: 'uniq_internal_event_id' }
  );
  await db.collection('processed_events').createIndex(
    { createdAt: 1 },
    { expireAfterSeconds: 72 * 60 * 60, name: 'ttl_processed_events_72h' }
  );

  // Idempotency storage
  await db.collection('idempotency_keys').createIndex(
    { key: 1 },
    { unique: true, name: 'uniq_idempotency_key' }
  );
  await db.collection('idempotency_keys').createIndex(
    { expiresAt: 1 },
    { expireAfterSeconds: 0, name: 'ttl_idempotency_keys' }
  );

  await db.collection('otps').createIndex(
    { otp_id: 1 },
    { unique: true, name: 'uniq_otp_id' }
  );
  await db.collection('otps').createIndex(
    { expiresAt: 1 },
    { expireAfterSeconds: 0, name: 'ttl_otps' }
  );

  await db.collection('audit_logs').createIndex(
    { internal_event_id: 1, user_id: 1, action: 1, at: 1 },
    { name: 'audit_lookup' }
  );

  await db.collection('messages').createIndex(
    { to: 1, channel: 1, createdAt: -1 },
    { name: 'messages_to_channel' }
  );
  await db.collection('messages').createIndex(
    { status: 1, createdAt: -1 },
    { name: 'messages_status' }
  );

  await db.collection('blocked_ips').createIndex(
    { ip: 1 },
    { unique: true, name: 'uniq_ip' }
  );
  await db.collection('refunds').createIndex(
    { refund_id: 1 },
    { unique: true, name: 'uniq_refund_id' }
  );
  await db.collection('refunds').createIndex(
    { status: 1, createdAt: -1 },
    { name: 'refunds_status_createdAt' }
  );

  // Signature replay guard
  await db.collection('signature_replays').createIndex(
    { key: 1 },
    { unique: true, name: 'uniq_signature_replay_key' }
  );
  await db.collection('signature_replays').createIndex(
    { expiresAt: 1 },
    { expireAfterSeconds: 0, name: 'ttl_signature_replays' }
  );

  // Basic schema validation (best-effort; ignore failures if permissions are limited)
  try {
    await db.command({
      collMod: 'idempotency_keys',
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['key', 'requestHash', 'status', 'createdAt', 'expiresAt'],
          properties: {
            key: { bsonType: 'string' },
            requestHash: { bsonType: 'string' },
            status: { enum: ['in_progress', 'succeeded', 'failed'] },
            createdAt: { bsonType: 'date' },
            expiresAt: { bsonType: 'date' }
          }
        }
      }
    });
  } catch {
    // ignore
  }
}


