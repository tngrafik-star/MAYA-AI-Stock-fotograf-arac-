// GA4 / Google Ads events. gtag is loaded on every page after consent.js;
// with consent denied Google only receives cookieless pings (Consent Mode).
// Ad blockers can remove gtag entirely, so every call is optional.

const PLAN_PRICES_USD = { starter: 9.99, pro: 29.99, studio: 49.99 };

export function track(eventName, params = {}) {
  try {
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, params);
    }
  } catch (e) {
    // Analytics must never break the app
  }
}

export function planItem(plan, billingCycle = 'monthly') {
  return {
    item_id: `${plan}_${billingCycle}`,
    item_name: `MayaListing ${plan.charAt(0).toUpperCase() + plan.slice(1)}`,
    item_category: 'subscription',
    price: PLAN_PRICES_USD[plan] || 0,
    quantity: 1
  };
}

export function planValue(plan) {
  return PLAN_PRICES_USD[plan] || 0;
}
