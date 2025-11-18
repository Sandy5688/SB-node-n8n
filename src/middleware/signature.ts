import { Request, Response, NextFunction } from 'express';
import { hmacSha256Hex, timingSafeEqualHex } from '../lib/hmac';

export function verifyHmacSignature() {
  const secret = process.env.HMAC_SECRET;
  if (!secret) {
    throw new Error('HMAC_SECRET is not set');
  }
  return (req: Request, res: Response, next: NextFunction): void => {
    const signatureHeader = (req.header('X-Signature') || '').trim();
    const timestampHeader = (req.header('X-Timestamp') || '').trim();
    if (!signatureHeader) {
      res.status(401).json({ error: { message: 'Missing signature' } });
      return;
    }
    // Accept formats: "sha256=<hex>" or "<hex>"
    const parts = signatureHeader.split('=');
    const sigHex = parts.length === 2 ? parts[1] : parts[0];
    const raw = (req as any).rawBody as Buffer | undefined;
    if (!raw) {
      res.status(400).json({ error: { message: 'Missing raw body for signature verification' } });
      return;
    }
    // Optional timestamp drift check
    if (timestampHeader) {
      const now = Math.floor(Date.now() / 1000);
      const ts = Number(timestampHeader);
      if (!Number.isFinite(ts) || Math.abs(now - ts) > 300) {
        res.status(401).json({ error: { message: 'Signature timestamp out of allowed window' } });
        return;
      }
    }
    const computed = hmacSha256Hex(secret, raw);
    if (!timingSafeEqualHex(sigHex, computed)) {
      res.status(401).json({ error: { message: 'Invalid signature' } });
      return;
    }
    next();
  };
}


