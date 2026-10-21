// Only allow same-origin paths after sign-in, so a crafted ?redirect= cannot
// send users to another site or run a javascript: URL
export function safeRedirectPath(value, origin, fallback = '/app/') {
  if (!value) return fallback;
  try {
    const target = new URL(value, origin);
    if (target.origin !== origin) return fallback;
    return target.pathname + target.search + target.hash;
  } catch (e) {
    return fallback;
  }
}
