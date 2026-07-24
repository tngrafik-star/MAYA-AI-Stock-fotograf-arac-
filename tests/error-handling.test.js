import { describe, it, expect } from 'vitest';

// Simulate error handler (from server.js)
const handleGeminiError = (status, errorData) => {
  const message = errorData?.error?.message || '';

  if (status === 429) {
    return {
      status: 429,
      userMessage: 'Çok fazla istek gönderdiniz. Lütfen birkaç saniye sonra tekrar deneyin.',
      type: 'RATE_LIMIT',
      retriable: true
    };
  }

  if (status === 403 || message.includes('quota')) {
    return {
      status: 403,
      userMessage: 'API quota aşılmıştır. Lütfen daha sonra tekrar deneyin.',
      type: 'QUOTA_EXCEEDED',
      retriable: false
    };
  }

  if (status === 400 || message.includes('invalid')) {
    return {
      status: 400,
      userMessage: 'Görsel biçimi veya içeriği geçersiz. Lütfen PNG/JPG görseli deneyin.',
      type: 'INVALID_INPUT',
      retriable: false
    };
  }

  if (status === 500 || status === 503) {
    return {
      status: status,
      userMessage: 'AI servisi geçici olarak unavailable. Lütfen birkaç saniye sonra tekrar deneyin.',
      type: 'SERVICE_ERROR',
      retriable: true
    };
  }

  return {
    status: status || 500,
    userMessage: message || 'AI API hatası oluştu. Lütfen tekrar deneyin.',
    type: 'UNKNOWN_ERROR',
    retriable: false
  };
};

describe('Gemini Error Classification', () => {
  it('should classify rate limit errors (429)', () => {
    const error = handleGeminiError(429, {});

    expect(error.type).toBe('RATE_LIMIT');
    expect(error.status).toBe(429);
    expect(error.retriable).toBe(true);
    expect(error.userMessage).toContain('Çok fazla istek');
  });

  it('should classify quota exceeded errors (403)', () => {
    const error = handleGeminiError(403, {});

    expect(error.type).toBe('QUOTA_EXCEEDED');
    expect(error.status).toBe(403);
    expect(error.retriable).toBe(false);
    expect(error.userMessage).toContain('quota');
  });

  it('should classify quota in message', () => {
    const error = handleGeminiError(400, {
      error: { message: 'Quota exceeded' }
    });

    expect(error.type).toBe('QUOTA_EXCEEDED');
    expect(error.retriable).toBe(false);
  });

  it('should classify invalid input errors (400)', () => {
    const error = handleGeminiError(400, {
      error: { message: 'Invalid image format' }
    });

    expect(error.type).toBe('INVALID_INPUT');
    expect(error.status).toBe(400);
    expect(error.retriable).toBe(false);
    expect(error.userMessage).toContain('Görsel biçimi');
  });

  it('should classify server errors (500)', () => {
    const error = handleGeminiError(500, {});

    expect(error.type).toBe('SERVICE_ERROR');
    expect(error.status).toBe(500);
    expect(error.retriable).toBe(true);
  });

  it('should classify service unavailable (503)', () => {
    const error = handleGeminiError(503, {});

    expect(error.type).toBe('SERVICE_ERROR');
    expect(error.status).toBe(503);
    expect(error.retriable).toBe(true);
  });

  it('should handle unknown errors', () => {
    const error = handleGeminiError(418, { error: { message: 'I am a teapot' } });

    expect(error.type).toBe('UNKNOWN_ERROR');
    expect(error.status).toBe(418);
    expect(error.retriable).toBe(false);
  });
});

describe('Error Message Handling', () => {
  it('should provide user-friendly messages', () => {
    const error = handleGeminiError(429, {});
    expect(error.userMessage).toBeTruthy();
    expect(error.userMessage).not.toContain('undefined');
    expect(error.userMessage.length).toBeGreaterThan(0);
  });

  it('should include error type for client handling', () => {
    const errors = [
      handleGeminiError(429, {}),
      handleGeminiError(403, {}),
      handleGeminiError(400, {}),
      handleGeminiError(500, {})
    ];

    errors.forEach(error => {
      expect(['RATE_LIMIT', 'QUOTA_EXCEEDED', 'INVALID_INPUT', 'SERVICE_ERROR']).toContain(error.type);
    });
  });

  it('should indicate if error is retriable', () => {
    const retriableErrors = [
      handleGeminiError(429, {}),
      handleGeminiError(500, {}),
      handleGeminiError(503, {})
    ];

    retriableErrors.forEach(error => {
      expect(error.retriable).toBe(true);
    });

    const nonRetriableErrors = [
      handleGeminiError(403, {}),
      handleGeminiError(400, {})
    ];

    nonRetriableErrors.forEach(error => {
      expect(error.retriable).toBe(false);
    });
  });
});

describe('Error Handling Edge Cases', () => {
  it('should handle missing error data', () => {
    const error = handleGeminiError(500, undefined);
    expect(error.type).toBe('SERVICE_ERROR');
    expect(error.userMessage).toBeTruthy();
  });

  it('should handle missing message in error data', () => {
    const error = handleGeminiError(400, { error: {} });
    expect(error.type).toBe('INVALID_INPUT');
  });

  it('should handle null error status', () => {
    const error = handleGeminiError(null, {});
    expect(error.status).toBe(500);
    expect(error.type).toBe('UNKNOWN_ERROR');
  });

  it('should handle string messages', () => {
    const error = handleGeminiError(400, {
      error: { message: 'Invalid image: too large' }
    });

    expect(error.userMessage).toContain('Görsel biçimi');
  });
});

describe('Error Response Structure', () => {
  it('should always return required fields', () => {
    const error = handleGeminiError(429, {});

    expect(error).toHaveProperty('status');
    expect(error).toHaveProperty('userMessage');
    expect(error).toHaveProperty('type');
    expect(error).toHaveProperty('retriable');
  });

  it('should have valid HTTP status codes', () => {
    const statusCodes = [400, 403, 429, 500, 503];
    statusCodes.forEach(code => {
      const error = handleGeminiError(code, {});
      expect([400, 403, 429, 500, 503]).toContain(error.status);
    });
  });
});
