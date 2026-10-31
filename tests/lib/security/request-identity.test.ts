import { describe, expect, it } from 'vitest';
import { clientKey, correlationId } from '@/lib/security/guards';

function request(headers: Record<string, string> = {}): Request {
  return new Request('https://gatherly.example/api/chat', { headers });
}

describe('clientKey', () => {
  it('prefers x-real-ip when the platform sets it', () => {
    expect(
      clientKey(
        request({ 'x-real-ip': '198.51.100.7', 'x-forwarded-for': '6.6.6.6, 203.0.113.5' }),
      ),
    ).toBe('198.51.100.7');
  });

  it('uses the last forwarded address, the one the nearest proxy saw', () => {
    expect(clientKey(request({ 'x-forwarded-for': '203.0.113.5, 70.41.3.18' }))).toBe('70.41.3.18');
  });

  it('ignores a spoofed first entry so rotating it cannot dodge the limit', () => {
    const spoofed = request({ 'x-forwarded-for': '1.1.1.1, 203.0.113.5' });
    const rotated = request({ 'x-forwarded-for': '9.9.9.9, 203.0.113.5' });

    expect(clientKey(spoofed)).toBe('203.0.113.5');
    expect(clientKey(rotated)).toBe('203.0.113.5');
  });

  it('trims the whitespace around the hop it uses', () => {
    expect(clientKey(request({ 'x-forwarded-for': '  10.0.0.9  ,  10.0.0.10  ' }))).toBe(
      '10.0.0.10',
    );
  });

  it('takes a single forwarded address as it is', () => {
    expect(clientKey(request({ 'x-forwarded-for': '10.0.0.1' }))).toBe('10.0.0.1');
  });

  it('falls back to one local bucket when the header is blank', () => {
    expect(clientKey(request({ 'x-forwarded-for': ' , ' }))).toBe('local');
    expect(clientKey(request({ 'x-real-ip': '   ' }))).toBe('local');
  });

  it('falls back to one local bucket when no header is present', () => {
    expect(clientKey(request())).toBe('local');
  });
});

describe('correlationId', () => {
  it('passes through a well-shaped id the client supplied', () => {
    expect(correlationId(request({ 'x-correlation-id': 'req_abc12345' }))).toBe('req_abc12345');
  });

  it('accepts the eight and sixty-four character boundaries', () => {
    expect(correlationId(request({ 'x-correlation-id': 'abcdefgh' }))).toBe('abcdefgh');
    expect(correlationId(request({ 'x-correlation-id': 'a'.repeat(64) }))).toBe('a'.repeat(64));
  });

  it('replaces a too-short, too-long or malformed id', () => {
    for (const id of ['abc', 'a'.repeat(65), 'has spaces', 'drop;table', '<script>']) {
      const generated = correlationId(request({ 'x-correlation-id': id }));
      expect(generated).not.toBe(id);
      expect(generated).toMatch(/^req_[0-9a-f-]{36}$/);
    }
  });

  it('generates a fresh random id when there is none', () => {
    const first = correlationId(request());
    const second = correlationId(request());

    expect(first).toMatch(/^req_[0-9a-f-]{36}$/);
    expect(first).not.toBe(second);
  });
});
