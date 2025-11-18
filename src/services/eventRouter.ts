import { http } from '../lib/http';
import { logger } from '../lib/logger';

export async function forwardToN8n(params: {
  ingestUrl?: string;
  token?: string;
  payload: any;
  internalEventId: string;
  correlationId?: string;
}): Promise<{ ok: boolean; status: number; body?: any }> {
  const url = params.ingestUrl || process.env.N8N_INGEST_URL;
  const token = params.token || process.env.N8N_TOKEN;
  if (!url) {
    logger.warn('N8N_INGEST_URL not configured; skipping forward');
    return { ok: true, status: 204 };
  }
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Internal-Event-Id': params.internalEventId
  };
  if (params.correlationId) headers['X-Correlation-Id'] = params.correlationId;
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await http.post(url, params.payload, { headers });
  const ok = res.status >= 200 && res.status < 300;
  if (!ok) {
    logger.error(`Failed to forward to n8n: ${res.status} ${JSON.stringify(res.data)}`);
  }
  return { ok, status: res.status, body: res.data };
}


