// Billing rules shared by the API server, scripts and tests.
// Pure functions only: no network or database access here.

export const PLAN_LIMITS = {
  free: 5,
  starter: 300,
  pro: 1000,
  studio: 999999
};

// Map a Lemon Squeezy variant id (monthly or yearly) back to our plan name
export const planFromVariant = (variantId, env = process.env) => {
  if (!variantId) return null;
  const variants = {
    starter: [env.LEMON_SQUEEZY_VARIANT_STARTER, env.LEMON_SQUEEZY_VARIANT_STARTER_YEARLY],
    pro: [env.LEMON_SQUEEZY_VARIANT_PRO, env.LEMON_SQUEEZY_VARIANT_PRO_YEARLY],
    studio: [env.LEMON_SQUEEZY_VARIANT_STUDIO, env.LEMON_SQUEEZY_VARIANT_STUDIO_YEARLY]
  };
  return Object.keys(variants).find(plan => variants[plan].filter(Boolean).includes(String(variantId))) || null;
};

export const nextMonth = (now = new Date()) => {
  const date = new Date(now);
  date.setMonth(date.getMonth() + 1);
  return date.toISOString();
};

/**
 * Decide how a Lemon Squeezy subscription event changes a profile.
 * Returns { updates } (null when nothing should change) or { error } for an
 * event that cannot be applied.
 */
export const decideLemonUpdate = ({ eventName, attrs = {}, subscriptionId, profile, plan, now = new Date() }) => {
  // Events about an older subscription must not touch the user's current one
  // (e.g. the previous plan expiring after an upgrade created a new subscription)
  const isCurrentSubscription = !profile.lemon_subscription_id || profile.lemon_subscription_id === subscriptionId;

  if (eventName === 'subscription_created') {
    if (!PLAN_LIMITS[plan]) {
      return { error: `Unknown plan for variant ${attrs.variant_id}` };
    }
    return {
      updates: {
        plan,
        generations_limit: PLAN_LIMITS[plan],
        generations_used: 0,
        usage_reset_at: nextMonth(now),
        subscription_status: attrs.status,
        subscription_ends_at: null,
        lemon_subscription_id: subscriptionId,
        lemon_customer_id: attrs.customer_id ? String(attrs.customer_id) : null
      }
    };
  }

  if (!isCurrentSubscription) {
    return { updates: null };
  }

  if (eventName === 'subscription_payment_success') {
    // New billing period paid: give the full monthly quota again
    return { updates: { generations_used: 0, usage_reset_at: nextMonth(now) } };
  }

  if (eventName === 'subscription_expired' || attrs.status === 'expired') {
    return {
      updates: {
        plan: 'free',
        generations_limit: PLAN_LIMITS.free,
        generations_used: 0,
        usage_reset_at: nextMonth(now),
        subscription_status: 'expired',
        subscription_ends_at: null
      }
    };
  }

  // updated / cancelled / resumed / paused / unpaused: cancelled subscriptions keep
  // access until ends_at, then subscription_expired downgrades them
  const updates = {
    subscription_status: attrs.status,
    subscription_ends_at: attrs.ends_at || null,
    lemon_subscription_id: subscriptionId
  };
  if ((attrs.status === 'active' || attrs.status === 'on_trial') && PLAN_LIMITS[plan]) {
    // Plan changes (in the app or the customer portal) arrive as subscription_updated
    updates.plan = plan;
    updates.generations_limit = PLAN_LIMITS[plan];
  }
  return { updates };
};
