# MayaListing API

Base URL: `https://www.mayalisting.com` (local: `http://localhost:3001`).
All endpoints return JSON. Errors have the shape `{ "error": { "message": "...", "type": "...", "retriable": false } }`.

## Authentication

Endpoints marked 🔒 need the user's Supabase access token:

```
Authorization: Bearer <supabase access_token>
```

The server validates it with Supabase Auth (`auth.getUser`); expired, revoked or forged tokens get `401`.

---

## Health

### GET /api/health

Configuration status of Gemini, Supabase and email. Always `200`.

### GET /api/health?deep=1

Also checks that both Gemini models are still served, that the credit tables are readable and how close the global daily cap is. Answers `503` with `status: "degraded"` and a `deep.problems` list when something is wrong. Cached for 10 minutes. Used by `.github/workflows/monitor.yml`.

---

## Image analysis

### POST /api/generate 🔒

```json
{ "base64DataUrl": "data:image/jpeg;base64,...", "categoryKey": "decor", "language": "tr" }
```

- `base64DataUrl`: JPEG, PNG or WEBP data URL, at most 2 MB (the app sends a 1024px JPEG).
- `categoryKey`: one of `decor, cosmetics, tech, food, landscape, fashion, fitness, business, architecture, animals, travel, automotive, portrait, other`.
- `language`: `tr` or `en` (stock fields are always English).

The plan is read from the database, never from the request. One credit is consumed atomically before the AI call and refunded if the call fails.

**200** — generated metadata plus the user's usage:

```json
{
  "category": "decor",
  "title": "...", "description": "...", "keywords": "...", "tags": "...",
  "adobe": { "title": "...", "keywords": "..." },
  "shutterstock": { "title": "...", "description": "...", "keywords": "..." },
  "freepik": { "title": "...", "keywords": "..." },
  "vecteezy": { "title": "...", "description": "...", "keywords": "..." },
  "ecommerce": { "title": "...", "description": "...", "tags": "..." },
  "usage": { "plan": "pro", "generations_used": 12, "generations_limit": 1000, "usage_reset_at": "..." }
}
```

| Status | `type` | Meaning |
| --- | --- | --- |
| 400 | — | Invalid body or image data |
| 401 | — | Missing or invalid token |
| 402 | `LIMIT_REACHED` | Monthly quota used up |
| 403 | `EMAIL_NOT_CONFIRMED` | Email address not confirmed |
| 413 / 415 | — | Image over 2 MB / unsupported type |
| 429 | `DAILY_LIMIT`, `IP_LIMIT`, `RATE_LIMIT` | Daily plan limit, free-plan per-network limit, or Gemini rate limit |
| 503 | `SERVICE_BUSY`, `QUOTA_CHECK_FAILED` | Global daily cap reached, or credit system not configured |
| 500 | `PARSE_ERROR`, `EMPTY_RESPONSE`, ... | AI call failed (credit refunded) |

Limits live in `public.app_limits` and can be changed with SQL.

---

## History and account

### POST /api/history/delete 🔒

`{ "resultId": "<uuid>" }` — deletes one analysis and its stored image. `404` when the record does not belong to the caller.

### POST /api/account/delete 🔒

`{ "confirmEmail": "user@example.com" }` — the user's own email, typed to confirm. Cancels a paying Lemon Squeezy subscription (stops with `502` if that fails), removes every image in the user's storage folder and deletes the auth user, which cascades to profile, uploads, results and activity.

---

## Payments (Lemon Squeezy)

### POST /api/payment/lemon/create-checkout-session 🔒

```json
{ "plan": "pro", "userId": "<uuid>", "billingCycle": "monthly", "successUrl": "...", "cancelUrl": "..." }
```

Returns `{ "url": "https://...lemonsqueezy.com/checkout/..." }` for a new subscription. If the user already has an active subscription, the plan is switched on that subscription instead and the response is `{ "updated": true, "plan": "pro", "cycle": "monthly" }`.

### POST /api/payment/lemon/cancel-subscription 🔒

Cancels the current subscription at the end of the paid period. Returns `{ "status": "cancelled", "endsAt": "..." }`.

### POST /api/payment/lemon/webhook

Signed by Lemon Squeezy (`X-Signature`, HMAC-SHA256 of the raw body with `LEMON_SQUEEZY_WEBHOOK_SECRET`). Handled events:

| Event | Effect |
| --- | --- |
| `subscription_created` | Sets plan, limit, fresh monthly quota, stores subscription id |
| `subscription_updated`, `_resumed`, `_unpaused`, `_paused`, `_cancelled` | Stores status and end date; plan changes apply the new plan |
| `subscription_payment_success` | Resets the monthly quota |
| `subscription_payment_refunded` | Downgrades to Free |
| `subscription_expired` | Downgrades to Free |

Events for an older subscription are ignored. Each event is recorded in `webhook_events` for idempotency.

---

## Support email auto-reply

### POST /api/email/inbound

Called by the inbound email provider with `x-inbound-secret: <EMAIL_INBOUND_SECRET>` (or `?secret=`). Body: `{ "from": "...", "subject": "...", "text": "..." }`. Automated senders, our own address, auto-submitted/bulk mail and long reply chains are skipped; replies are capped per sender and per day.

---

## Testing locally

```bash
npm test
curl http://localhost:3001/api/health?deep=1
```
