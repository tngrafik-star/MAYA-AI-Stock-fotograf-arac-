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
