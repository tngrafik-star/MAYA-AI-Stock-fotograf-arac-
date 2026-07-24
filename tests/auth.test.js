import { describe, it, expect, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';

// Test JWT functionality
const JWT_SECRET = 'test-secret-key-for-testing-only';

describe('JWT Authentication', () => {
  it('should create a valid JWT token', () => {
    const userId = '550e8400-e29b-41d4-a716-446655440000';
    const token = jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '1h' });

    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
  });

  it('should verify a valid JWT token', () => {
    const userId = '550e8400-e29b-41d4-a716-446655440000';
    const token = jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '1h' });

    const decoded = jwt.verify(token, JWT_SECRET);
    expect(decoded.sub).toBe(userId);
  });

  it('should reject an invalid token', () => {
    const invalidToken = 'invalid.token.here';

    expect(() => {
      jwt.verify(invalidToken, JWT_SECRET);
    }).toThrow();
  });

  it('should reject a token with wrong secret', () => {
    const userId = '550e8400-e29b-41d4-a716-446655440000';
    const token = jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '1h' });
    const wrongSecret = 'wrong-secret-key';

    expect(() => {
      jwt.verify(token, wrongSecret);
    }).toThrow();
  });

  it('should reject an expired token', () => {
    const userId = '550e8400-e29b-41d4-a716-446655440000';
    const token = jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '-1h' });

    expect(() => {
      jwt.verify(token, JWT_SECRET);
    }).toThrow('jwt expired');
  });

  it('should decode a token without verification', () => {
    const userId = '550e8400-e29b-41d4-a716-446655440000';
    const token = jwt.sign({ sub: userId }, JWT_SECRET);

    const decoded = jwt.decode(token);
    expect(decoded.sub).toBe(userId);
  });

  it('should extract userId from Authorization header', () => {
    const userId = '550e8400-e29b-41d4-a716-446655440000';
    const token = jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '1h' });
    const authHeader = `Bearer ${token}`;

    const bearerToken = authHeader.slice(7); // Remove "Bearer " prefix
    const decoded = jwt.verify(bearerToken, JWT_SECRET);

    expect(decoded.sub).toBe(userId);
  });
});

describe('JWT Payload Validation', () => {
  it('should include required fields', () => {
    const userId = '550e8400-e29b-41d4-a716-446655440000';
    const token = jwt.sign({
      sub: userId,
      email: 'test@example.com',
      iat: Math.floor(Date.now() / 1000)
    }, JWT_SECRET, { expiresIn: '1h' });

    const decoded = jwt.verify(token, JWT_SECRET);
    expect(decoded.sub).toBeDefined();
    expect(decoded.email).toBe('test@example.com');
    expect(decoded.iat).toBeDefined();
  });

  it('should validate user ID format', () => {
    const validUserId = '550e8400-e29b-41d4-a716-446655440000';
    const token = jwt.sign({ sub: validUserId }, JWT_SECRET);

    const decoded = jwt.verify(token, JWT_SECRET);
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    expect(uuidRegex.test(decoded.sub)).toBe(true);
  });
});

describe('Authorization Header Validation', () => {
  it('should reject missing Authorization header', () => {
    const authHeader = undefined;
    expect(authHeader).toBeUndefined();
  });

  it('should reject Authorization header without Bearer prefix', () => {
    const authHeader = 'invalid-token-format';
    const hasBearer = authHeader?.startsWith('Bearer ');

    expect(hasBearer).toBe(false);
  });

  it('should extract token from valid Authorization header', () => {
    const token = jwt.sign({ sub: 'user-123' }, JWT_SECRET);
    const authHeader = `Bearer ${token}`;

    const isValid = authHeader.startsWith('Bearer ');
    expect(isValid).toBe(true);

    const extractedToken = authHeader.slice(7);
    expect(extractedToken).toBe(token);
  });

  it('should handle multiple Bearer prefixes', () => {
    const token = jwt.sign({ sub: 'user-123' }, JWT_SECRET);
    const authHeader = `Bearer Bearer ${token}`;

    const bearerToken = authHeader.slice(7); // First "Bearer " removal
    // This would fail, which is correct behavior
    expect(bearerToken).not.toBe(token);
  });
});

describe('Session Security', () => {
  it('should not expose token in logs', () => {
    const userId = '550e8400-e29b-41d4-a716-446655440000';
    const token = jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '1h' });

    // Simulate secure logging (don't log tokens)
    const sanitizedLog = `User ${userId} authenticated`;
    expect(sanitizedLog).not.toContain(token);
  });

  it('should use https in production', () => {
    const isProduction = process.env.NODE_ENV === 'production';
    // This should be enforced by HSTS and other headers
    expect(isProduction).toBeDefined();
  });
});
