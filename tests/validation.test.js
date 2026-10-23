import { describe, it, expect } from 'vitest';

import { generateSchema, checkoutSessionSchema } from '../lib/api.js';

const IMAGE = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';

describe('Input Validation - generateSchema', () => {
  it('should accept valid generate request', () => {
    const validRequest = {
      base64DataUrl: IMAGE,
      categoryKey: 'decor',
      plan: 'starter',
      language: 'tr'
    };

    const { error } = generateSchema.validate(validRequest);
    expect(error).toBeUndefined();
  });

  it('should reject missing image data', () => {
    const invalidRequest = {
      categoryKey: 'decor',
      plan: 'starter'
    };

    const { error } = generateSchema.validate(invalidRequest);
    expect(error).toBeDefined();
    expect(error.details[0].message).toContain('Görsel verisi gerekli');
  });

  it('should reject invalid plan', () => {
    const invalidRequest = {
      base64DataUrl: IMAGE,
      categoryKey: 'decor',
      plan: 'invalid_plan'
    };

    const { error } = generateSchema.validate(invalidRequest);
    expect(error).toBeDefined();
    expect(error.details[0].message).toContain('Plan türü geçersiz');
  });

  it('should reject invalid language', () => {
    const invalidRequest = {
      base64DataUrl: IMAGE,
      categoryKey: 'decor',
      language: 'es'
    };

    const { error } = generateSchema.validate(invalidRequest);
    expect(error).toBeDefined();
    expect(error.details[0].message).toContain('Dil geçersiz');
  });

  it('should default to starter plan and tr language', () => {
    const request = {
      base64DataUrl: IMAGE,
      categoryKey: 'decor'
    };

    const { error, value } = generateSchema.validate(request);
    expect(error).toBeUndefined();
    expect(value.plan).toBe('starter');
    expect(value.language).toBe('tr');
  });

  it('should allow null customApiKey', () => {
    const validRequest = {
      base64DataUrl: IMAGE,
      categoryKey: 'decor',
      customApiKey: null
    };

    const { error } = generateSchema.validate(validRequest);
    expect(error).toBeUndefined();
  });
});

describe('Input Validation - checkoutSessionSchema', () => {
  it('should accept valid checkout request', () => {
    const validRequest = {
      plan: 'pro',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      billingCycle: 'monthly'
    };

    const { error } = checkoutSessionSchema.validate(validRequest);
    expect(error).toBeUndefined();
  });

  it('should reject missing plan', () => {
    const invalidRequest = {
      userId: '550e8400-e29b-41d4-a716-446655440000'
    };

    const { error } = generateSchema.validate(invalidRequest);
    expect(error).toBeDefined();
  });

  it('should reject invalid userId format', () => {
    const invalidRequest = {
      plan: 'pro',
      userId: 'not-a-uuid'
    };

    const { error } = checkoutSessionSchema.validate(invalidRequest);
    expect(error).toBeDefined();
    expect(error.details[0].message).toContain('Kullanıcı ID geçersiz');
  });

  it('should reject invalid billing cycle', () => {
    const invalidRequest = {
      plan: 'pro',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      billingCycle: 'quarterly'
    };

    const { error } = checkoutSessionSchema.validate(invalidRequest);
    expect(error).toBeDefined();
  });

  it('should validate URLs', () => {
    const validRequest = {
      plan: 'pro',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel'
    };

    const { error } = checkoutSessionSchema.validate(validRequest);
    expect(error).toBeUndefined();
  });

  it('should reject invalid URLs', () => {
    const invalidRequest = {
      plan: 'pro',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      successUrl: 'not a url'
    };

    const { error } = checkoutSessionSchema.validate(invalidRequest);
    expect(error).toBeDefined();
  });
});

describe('Plan Validation', () => {
  const validPlans = ['free', 'starter', 'pro', 'studio'];
  const invalidPlans = ['premium', 'vip', 'enterprise', 'custom'];

  validPlans.forEach(plan => {
    it(`should accept "${plan}" plan`, () => {
      const request = { plan, userId: '550e8400-e29b-41d4-a716-446655440000' };
      const { error } = checkoutSessionSchema.validate(request);
      expect(error).toBeUndefined();
    });
  });

  invalidPlans.forEach(plan => {
    it(`should reject "${plan}" plan`, () => {
      const request = { plan, userId: '550e8400-e29b-41d4-a716-446655440000' };
      const { error } = checkoutSessionSchema.validate(request);
      expect(error).toBeDefined();
    });
  });
});

import { parseImageDataUrl, geminiGenerationConfig, clientIp, consumeRefusal, skipAutoReplyReason, MAX_IMAGE_BYTES } from '../lib/api.js';

describe('Cost guards', () => {
  it('accepts a small JPEG data URL', () => {
    expect(parseImageDataUrl('data:image/jpeg;base64,/9j/4AAQSkZJRg==')).toEqual({ mimeType: 'image/jpeg', data: '/9j/4AAQSkZJRg==' });
  });

  it('rejects unsupported types and oversized images before any credit is spent', () => {
    expect(parseImageDataUrl('data:image/gif;base64,R0lGOD').error.status).toBe(415);
    const big = 'A'.repeat(Math.ceil((MAX_IMAGE_BYTES + 1024) * 4 / 3));
    expect(parseImageDataUrl(`data:image/png;base64,${big}`).error.status).toBe(413);
    expect(parseImageDataUrl('not an image').error.status).toBe(400);
  });

  it('turns thinking off for Flash and caps it for Pro', () => {
    expect(geminiGenerationConfig('gemini-2.5-flash')).toMatchObject({ maxOutputTokens: 4096, thinkingConfig: { thinkingBudget: 0 }, responseMimeType: 'application/json' });
    expect(geminiGenerationConfig('gemini-2.5-pro').thinkingConfig.thinkingBudget).toBe(512);
    expect(geminiGenerationConfig('gemini-2.5-flash', { json: false, maxOutputTokens: 800 })).toEqual({ maxOutputTokens: 800, thinkingConfig: { thinkingBudget: 0 } });
  });

  it('reads the client IP from proxy headers', () => {
    expect(clientIp({ 'x-real-ip': '1.2.3.4', 'x-forwarded-for': '5.6.7.8' })).toBe('1.2.3.4');
    expect(clientIp({ 'x-forwarded-for': '5.6.7.8, 10.0.0.1' })).toBe('5.6.7.8');
    expect(clientIp({})).toBeNull();
  });

  it('maps every limit refusal to a distinct status', () => {
    expect(consumeRefusal('monthly_limit').status).toBe(402);
    expect(consumeRefusal('daily_limit').status).toBe(429);
    expect(consumeRefusal('ip_limit').status).toBe(429);
    expect(consumeRefusal('service_busy').status).toBe(503);
    expect(consumeRefusal('email_not_confirmed').status).toBe(403);
  });
});

describe('Auto-reply loop guard', () => {
  const base = { fromEmail: 'customer@gmail.com', subject: 'Plan sorusu', ownAddress: 'destek.mayalisting@gmail.com' };

  it('answers a normal customer email', () => {
    expect(skipAutoReplyReason(base)).toBeNull();
  });

  it('skips automated senders, our own address and auto-replies', () => {
    expect(skipAutoReplyReason({ ...base, fromEmail: 'no-reply@shop.com' })).toBe('automated_sender');
    expect(skipAutoReplyReason({ ...base, fromEmail: 'MAILER-DAEMON@gmail.com' })).toBe('automated_sender');
    expect(skipAutoReplyReason({ ...base, fromEmail: 'destek.mayalisting@gmail.com' })).toBe('own_address');
    expect(skipAutoReplyReason({ ...base, subject: 'Otomatik yanıt: izindeyim' })).toBe('automated_subject');
    expect(skipAutoReplyReason({ ...base, subject: 'Out of Office: back Monday' })).toBe('automated_subject');
    expect(skipAutoReplyReason({ ...base, subject: 'Re: Re: Re: Plan' })).toBe('reply_chain');
    expect(skipAutoReplyReason({ ...base, headers: { 'auto-submitted': 'auto-replied' } })).toBe('auto_submitted');
    expect(skipAutoReplyReason({ ...base, headers: { precedence: 'bulk' } })).toBe('bulk_precedence');
  });
});
