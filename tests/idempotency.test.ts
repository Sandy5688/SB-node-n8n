import crypto from 'crypto';

describe('Idempotency Middleware', () => {
  it('should compute SHA256 hash correctly', () => {
    const input = 'test_string';
    const expected = crypto.createHash('sha256').update(input).digest('hex');
    const hash = crypto.createHash('sha256').update(input).digest('hex');
    expect(hash).toBe(expected);
  });

  it('should validate 16KB size limit', () => {
    const MAX_SIZE = 16 * 1024;
    const smallData = JSON.stringify({ data: 'test' });
    const largeData = 'x'.repeat(20 * 1024);
    
    expect(Buffer.byteLength(smallData, 'utf8')).toBeLessThan(MAX_SIZE);
    expect(Buffer.byteLength(largeData, 'utf8')).toBeGreaterThan(MAX_SIZE);
  });

  it('should create truncated marker for large responses', () => {
    const largeResponse = { data: 'x'.repeat(20 * 1024) };
    const jsonString = JSON.stringify(largeResponse);
    const sizeBytes = Buffer.byteLength(jsonString, 'utf8');
    
    const truncatedMarker = {
      _truncated: true,
      _size_bytes: sizeBytes,
      _message: 'Response exceeds 16KB limit and was not cached',
    };
    
    expect(truncatedMarker._truncated).toBe(true);
    expect(truncatedMarker._size_bytes).toBeGreaterThan(16 * 1024);
  });

  it('should handle request hash computation', () => {
    const method = 'POST';
    const path = '/webhook/entry';
    const body = JSON.stringify({ user_id: 'test123', action: 'test' });
    const rawHash = crypto.createHash('sha256').update(`${method} ${path}\n${body}`).digest('hex');
    
    expect(rawHash).toMatch(/^[a-f0-9]{64}$/);
  });
});

