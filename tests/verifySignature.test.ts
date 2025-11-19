import { hmacSha256Hex } from '../src/lib/hmac';
import { verifyHmacSignature } from '../src/middleware/signature';

function makeRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('verifyHmacSignature middleware', () => {
  const secret = 'test_secret';

  beforeEach(() => {
    process.env.HMAC_SECRET = secret;
    jest.clearAllMocks();
  });

  test('returns 401 when signature is missing', () => {
    const handler = verifyHmacSignature();
    const req: any = {
      header: (name: string) => {
        if (name.toLowerCase() === 'x-signature') return '';
        return '';
      },
      rawBody: Buffer.from('{}')
    };
    const res = makeRes();
    const next = jest.fn();
    handler(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  test('calls next() when signature is valid', () => {
    const payload = Buffer.from('{"ok":true}');
    const signature = hmacSha256Hex(secret, payload);
    const handler = verifyHmacSignature();
    const req: any = {
      header: (name: string) => {
        if (name.toLowerCase() === 'x-signature') return signature;
        return '';
      },
      rawBody: payload
    };
    const res = makeRes();
    const next = jest.fn();
    handler(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('returns 401 when signature is invalid', () => {
    const payload = Buffer.from('{"ok":true}');
    const handler = verifyHmacSignature();
    const req: any = {
      header: (name: string) => {
        if (name.toLowerCase() === 'x-signature') return 'deadbeef';
        return '';
      },
      rawBody: payload
    };
    const res = makeRes();
    const next = jest.fn();
    handler(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });
});


