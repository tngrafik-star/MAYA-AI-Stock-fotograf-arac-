import { describe, it, expect } from 'vitest';
import { PLAN_LIMITS, planFromVariant, nextMonth, decideLemonUpdate } from '../lib/billing.js';

const env = {
  LEMON_SQUEEZY_VARIANT_STARTER: '101',
  LEMON_SQUEEZY_VARIANT_STARTER_YEARLY: '102',
  LEMON_SQUEEZY_VARIANT_PRO: '201',
  LEMON_SQUEEZY_VARIANT_STUDIO: '301'
};
const now = new Date('2026-10-22T10:00:00Z');

describe('planFromVariant', () => {
  it('maps monthly and yearly variants to plans', () => {
    expect(planFromVariant(101, env)).toBe('starter');
    expect(planFromVariant('102', env)).toBe('starter');
    expect(planFromVariant(201, env)).toBe('pro');
    expect(planFromVariant(301, env)).toBe('studio');
  });

  it('returns null for unknown or missing variants', () => {
    expect(planFromVariant(999, env)).toBeNull();
    expect(planFromVariant(undefined, env)).toBeNull();
  });

  it('does not match an unset yearly variant', () => {
    expect(planFromVariant('undefined', env)).toBeNull();
  });
});

describe('nextMonth', () => {
  it('adds one calendar month', () => {
    expect(nextMonth(now)).toBe('2026-11-22T10:00:00.000Z');
  });
});

describe('decideLemonUpdate', () => {
  const freshProfile = { id: 'u1', lemon_subscription_id: null };
  const subscribed = { id: 'u1', lemon_subscription_id: 'sub_1' };

  it('subscription_created activates the plan with a full quota', () => {
    const { updates } = decideLemonUpdate({
      eventName: 'subscription_created',
      attrs: { status: 'active', customer_id: 55, variant_id: 201 },
      subscriptionId: 'sub_1',
      profile: freshProfile,
      plan: 'pro',
      now
    });
    expect(updates).toMatchObject({
      plan: 'pro',
      generations_limit: PLAN_LIMITS.pro,
      generations_used: 0,
      lemon_subscription_id: 'sub_1',
      lemon_customer_id: '55',
      usage_reset_at: '2026-11-22T10:00:00.000Z'
    });
  });

  it('subscription_created with an unknown plan is an error', () => {
    const result = decideLemonUpdate({ eventName: 'subscription_created', attrs: { variant_id: 9 }, subscriptionId: 's', profile: freshProfile, plan: undefined, now });
    expect(result.error).toMatch(/Unknown plan/);
  });

  it('payment_success resets usage for the current subscription', () => {
    const { updates } = decideLemonUpdate({ eventName: 'subscription_payment_success', attrs: {}, subscriptionId: 'sub_1', profile: subscribed, now });
    expect(updates).toEqual({ generations_used: 0, usage_reset_at: '2026-11-22T10:00:00.000Z' });
  });

  it('cancellation keeps the plan until the period ends', () => {
    const { updates } = decideLemonUpdate({
      eventName: 'subscription_cancelled',
      attrs: { status: 'cancelled', ends_at: '2026-11-01T00:00:00Z' },
      subscriptionId: 'sub_1',
      profile: subscribed,
      plan: 'pro',
      now
    });
    expect(updates).toEqual({ subscription_status: 'cancelled', subscription_ends_at: '2026-11-01T00:00:00Z', lemon_subscription_id: 'sub_1' });
    expect(updates.plan).toBeUndefined();
  });

  it('expiry downgrades to free', () => {
    const { updates } = decideLemonUpdate({ eventName: 'subscription_expired', attrs: { status: 'expired' }, subscriptionId: 'sub_1', profile: subscribed, now });
    expect(updates).toMatchObject({ plan: 'free', generations_limit: PLAN_LIMITS.free, subscription_status: 'expired' });
  });

  it('a plan change arrives as subscription_updated and switches the limit', () => {
    const { updates } = decideLemonUpdate({ eventName: 'subscription_updated', attrs: { status: 'active' }, subscriptionId: 'sub_1', profile: subscribed, plan: 'studio', now });
    expect(updates).toMatchObject({ plan: 'studio', generations_limit: PLAN_LIMITS.studio });
  });

  it('ignores events for an older subscription', () => {
    const result = decideLemonUpdate({ eventName: 'subscription_expired', attrs: { status: 'expired' }, subscriptionId: 'sub_old', profile: subscribed, now });
    expect(result.updates).toBeNull();
  });
});
