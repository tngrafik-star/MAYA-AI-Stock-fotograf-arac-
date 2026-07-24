import { describe, it, expect, beforeEach } from 'vitest';

// Simulate rate limiter (from server.js)
class RateLimiter {
  constructor() {
    this.limits = new Map();
  }

  check(ip, limitCount, windowMs) {
    const now = Date.now();

    if (!this.limits.has(ip)) {
      this.limits.set(ip, { count: 1, resetTime: now + windowMs });
      return { allowed: true, remaining: limitCount - 1, resetTime: now + windowMs };
    }

    const limitInfo = this.limits.get(ip);
    if (now > limitInfo.resetTime) {
      limitInfo.count = 1;
      limitInfo.resetTime = now + windowMs;
      return { allowed: true, remaining: limitCount - 1, resetTime: now + windowMs };
    }

    limitInfo.count++;
    const remaining = Math.max(0, limitCount - limitInfo.count);

    if (limitInfo.count > limitCount) {
      return { allowed: false, remaining: 0, resetTime: limitInfo.resetTime };
    }

    return { allowed: true, remaining, resetTime: limitInfo.resetTime };
  }

  cleanup(expiredThreshold = 60000) {
    const now = Date.now();
    let cleaned = 0;

    for (const [ip, limitInfo] of this.limits.entries()) {
      if (now > limitInfo.resetTime + expiredThreshold) {
        this.limits.delete(ip);
        cleaned++;
      }
    }

    return cleaned;
  }
}

describe('Rate Limiter', () => {
  let limiter;
  const ip = '192.168.1.100';
  const limitCount = 10;
  const windowMs = 60000; // 1 minute

  beforeEach(() => {
    limiter = new RateLimiter();
  });

  it('should allow requests under limit', () => {
    for (let i = 0; i < 10; i++) {
      const result = limiter.check(ip, limitCount, windowMs);
      expect(result.allowed).toBe(true);
    }
  });

  it('should block requests over limit', () => {
    // Make 11 requests (limit is 10)
    let lastResult;
    for (let i = 0; i < 11; i++) {
      lastResult = limiter.check(ip, limitCount, windowMs);
    }

    expect(lastResult.allowed).toBe(false);
    expect(lastResult.remaining).toBe(0);
  });

  it('should track remaining requests correctly', () => {
    const results = [];
    for (let i = 0; i < 5; i++) {
      results.push(limiter.check(ip, limitCount, windowMs));
    }

    expect(results[0].remaining).toBe(9);
    expect(results[1].remaining).toBe(8);
    expect(results[2].remaining).toBe(7);
    expect(results[3].remaining).toBe(6);
    expect(results[4].remaining).toBe(5);
  });

  it('should reset limit after window expires', () => {
    // First request
    let result = limiter.check(ip, limitCount, windowMs);
    expect(result.allowed).toBe(true);

    // Simulate window expiration
    const limitInfo = limiter.limits.get(ip);
    limitInfo.resetTime = Date.now() - 1000; // Expire the window

    // Next request should reset
    result = limiter.check(ip, limitCount, windowMs);
    expect(result.allowed).toBe(true);
    expect(limiter.limits.get(ip).count).toBe(1);
  });

  it('should handle different IPs independently', () => {
    const ip1 = '192.168.1.100';
    const ip2 = '192.168.1.101';

    // Use all limit for ip1
    for (let i = 0; i < 10; i++) {
      limiter.check(ip1, limitCount, windowMs);
    }

    // ip2 should still have limit available
    const result = limiter.check(ip2, limitCount, windowMs);
    expect(result.allowed).toBe(true);
  });

  it('should return reset time', () => {
    const result = limiter.check(ip, limitCount, windowMs);
    expect(result.resetTime).toBeGreaterThan(Date.now());
    expect(result.resetTime).toBeLessThanOrEqual(Date.now() + windowMs + 100);
  });

  it('should clean up expired entries', () => {
    const ip1 = '192.168.1.100';
    const ip2 = '192.168.1.101';

    // Create entries
    limiter.check(ip1, limitCount, windowMs);
    limiter.check(ip2, limitCount, windowMs);

    expect(limiter.limits.size).toBe(2);

    // Expire ip1
    const limitInfo = limiter.limits.get(ip1);
    limitInfo.resetTime = Date.now() - 2000;

    // Cleanup
    const cleaned = limiter.cleanup(60000);
    expect(cleaned).toBe(1);
    expect(limiter.limits.size).toBe(1);
    expect(limiter.limits.has(ip2)).toBe(true);
    expect(limiter.limits.has(ip1)).toBe(false);
  });

  it('should not clean up active entries', () => {
    limiter.check(ip, limitCount, windowMs);
    const cleaned = limiter.cleanup(60000);

    expect(cleaned).toBe(0);
    expect(limiter.limits.has(ip)).toBe(true);
  });
});

describe('Rate Limiter - Different Limits', () => {
  let limiter;
  const ip = '192.168.1.100';

  beforeEach(() => {
    limiter = new RateLimiter();
  });

  it('should enforce stricter limits', () => {
    const strictLimit = 3;
    let result;

    for (let i = 0; i < 3; i++) {
      result = limiter.check(ip, strictLimit, 60000);
      expect(result.allowed).toBe(true);
    }

    result = limiter.check(ip, strictLimit, 60000);
    expect(result.allowed).toBe(false);
  });

  it('should enforce generous limits', () => {
    const generousLimit = 1000;
    let result;

    for (let i = 0; i < 100; i++) {
      result = limiter.check(ip, generousLimit, 60000);
      expect(result.allowed).toBe(true);
    }

    expect(result.remaining).toBe(900);
  });
});

describe('Rate Limiter - Proxy IP Handling', () => {
  let limiter;

  beforeEach(() => {
    limiter = new RateLimiter();
  });

  it('should use correct IP from x-forwarded-for', () => {
    const xForwardedFor = '203.0.113.10, 198.51.100.5, 192.168.1.1';
    const clientIp = xForwardedFor.split(',')[0].trim();

    const result = limiter.check(clientIp, 10, 60000);
    expect(result.allowed).toBe(true);
  });

  it('should handle single IP in x-forwarded-for', () => {
    const xForwardedFor = '203.0.113.10';
    const clientIp = xForwardedFor.split(',')[0].trim();

    const result = limiter.check(clientIp, 10, 60000);
    expect(result.allowed).toBe(true);
  });

  it('should handle empty x-forwarded-for', () => {
    const xForwardedFor = '';
    const clientIp = xForwardedFor.split(',')[0].trim() || 'unknown';

    const result = limiter.check(clientIp, 10, 60000);
    expect(result.allowed).toBe(true);
  });
});
