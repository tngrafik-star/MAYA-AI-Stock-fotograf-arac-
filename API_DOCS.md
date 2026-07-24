# MayaListing API Documentation

Base URL: `https://mayalisting.com` or `http://localhost:3001` (development)

All requests require `Authorization: Bearer {token}` header for protected endpoints.

---

## 🔐 Authentication

### GET /health
Health check endpoint for monitoring.

**No authentication required**

```bash
curl http://localhost:3001/health
```

**Response (200 OK):**
```json
{
  "status": "ok",
  "timestamp": "2024-07-24T12:00:00.000Z",
  "environment": "production",
  "services": {
    "supabase": { "status": "healthy" },
    "stripe": { "status": "healthy" },
    "email": { "status": "healthy" },
    "gemini": { "status": "healthy" }
  }
}
```

---

## 🖼️ Image Analysis

### POST /api/generate
Generate metadata (title, description, keywords) for an image using AI.

**Authentication:** Required (Bearer token)

**Rate Limit:** 30 requests per 15 minutes per IP

**Request Headers:**
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEA...",
  "categoryKey": "decor",
  "plan": "starter",
  "language": "tr"
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| imageData | string (base64) | ✓ | Image as data URL with base64 encoding (max 5MB) |
| categoryKey | string | ✓ | Category: `decor`, `cosmetics`, `tech`, `fashion`, etc. |
| plan | string | | Plan tier: `free`, `starter` (default), `pro`, `studio` |
| language | string | | Output language: `tr` (Turkish, default), `en` (English) |
| customApiKey | string | | (Deprecated) User's own Gemini API key |

**Response (200 OK):**
```json
{
  "title": "Minimalist Home Decor Set - White and Beige",
  "description": "Perfect for modern living spaces...",
  "keywords": "home decor, minimalist, white, beige, interior design",
  "tags": ["home-decor", "minimalist", "interior-design"],
  "adobestock": {
    "title": "Minimalist Home Decor",
    "keywords": "home decor, minimalist, beige"
  },
  "shutterstock": {
    "title": "Minimalist white home decor set",
    "keywords": "home decor, minimalist, white"
  }
}
```

**Error Responses:**

| Status | Error Type | Description |
|--------|-----------|-------------|
| 400 | INVALID_INPUT | Invalid image format or size |
| 401 | Unauthorized | Missing or invalid JWT token |
| 413 | Payload Too Large | Image exceeds 5MB limit |
| 429 | RATE_LIMIT | Too many requests, try again later |
| 403 | QUOTA_EXCEEDED | API quota exceeded |
| 500 | SERVICE_ERROR | Gemini API temporarily unavailable |

**Example cURL:**
```bash
curl -X POST http://localhost:3001/api/generate \
  -H "Authorization: Bearer eyJhbG..." \
  -H "Content-Type: application/json" \
  -d '{
    "imageData": "data:image/jpeg;base64,/9j/...",
    "categoryKey": "decor",
    "plan": "starter",
    "language": "tr"
  }'
```

---

## 💳 Payments

### POST /api/payment/create-checkout-session (Stripe)
Create a checkout session for plan upgrade.

**Authentication:** Required (Bearer token)

**Rate Limit:** Unlimited (JWT-protected)

**Request:**
```json
{
  "plan": "pro",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "billingCycle": "monthly",
  "successUrl": "https://mayalisting.com/app?payment=success",
  "cancelUrl": "https://mayalisting.com/app?payment=cancel"
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| plan | string | ✓ | Plan: `free`, `starter`, `pro`, `studio` |
| userId | string (UUID) | ✓ | Current user's ID |
| billingCycle | string | | `monthly` (default) or `yearly` |
| successUrl | string | | Redirect URL after successful payment |
| cancelUrl | string | | Redirect URL if user cancels |

**Response (200 OK):**
```json
{
  "id": "cs_test_123456",
  "url": "https://checkout.stripe.com/pay/cs_test_123456"
}
```

**Errors:**
- 401: Unauthorized
- 403: Forbidden (user trying to update another user's plan)
- 400: Invalid plan or user ID
- 500: Stripe API error

---

### POST /api/payment/lemon/create-checkout-session (Lemon Squeezy)
Create a checkout session with Lemon Squeezy payment processor.

**Authentication:** Required (Bearer token)

**Request:**
```json
{
  "plan": "pro",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "billingCycle": "monthly"
}
```

**Response (200 OK):**
```json
{
  "id": "ord_123456",
  "url": "https://lemonsqueezy.com/checkout/..."
}
```

---

## 📧 Email Webhook

### POST /api/email/inbound
Receive inbound emails and reply automatically.

**Authentication:** Query parameter or header (`x-inbound-secret`)

**Rate Limit:** 50 requests per minute per IP

**Request:**
```bash
POST /api/email/inbound?secret=inbound_sec_xxxxx
Content-Type: application/json

{
  "from": "customer@example.com",
  "subject": "How do I use the tool?",
  "text": "I need help getting started..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "replied": true
}
```

---

## 🪝 Webhooks

### Stripe Webhook: POST /api/payment/webhook
Receives payment events from Stripe.

**Signature Verification:** Required in production

**Headers:**
```
stripe-signature: t=...,v1=...
```

**Events Handled:**
- `checkout.session.completed`: User purchased a plan

**Payload:**
```json
{
  "id": "evt_123456",
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "metadata": {
        "userId": "550e8400-e29b-41d4-a716-446655440000",
        "plan": "pro",
        "limit": "1000"
      }
    }
  }
}
```

---

### Lemon Squeezy Webhook: POST /api/payment/lemon/webhook
Receives payment events from Lemon Squeezy.

**Signature Verification:** Required in production

**Headers:**
```
x-signature: hash
```

**Events Handled:**
- `order_created`: New order placed
- `subscription_created`: New subscription

---

## 🔒 Authentication & Authorization

### JWT Token
All protected endpoints require a valid JWT token in the `Authorization` header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Token obtained from:**
- Supabase Auth (via email/password or OAuth)
- Frontend: `supabase.auth.getSession()`

**Token Claims:**
```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "iat": 1234567890,
  "exp": 1234571490
}
```

---

## 🛑 Error Handling

### Standard Error Response

```json
{
  "error": {
    "message": "User-friendly error message in Turkish or English",
    "type": "ERROR_TYPE",
    "retriable": true
  }
}
```

**Error Types:**
- `RATE_LIMIT` - Too many requests (retriable)
- `QUOTA_EXCEEDED` - API quota exceeded (not retriable)
- `INVALID_INPUT` - Invalid request data (not retriable)
- `SERVICE_ERROR` - External service unavailable (retriable)
- `UNKNOWN_ERROR` - Unexpected error (may be retriable)

### HTTP Status Codes

| Status | Meaning |
|--------|---------|
| 200 | Success |
| 400 | Bad request (invalid input) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 413 | Payload too large |
| 429 | Rate limited |
| 500 | Server error |
| 503 | Service unavailable |

---

## 🔄 Idempotency

Payment webhooks are idempotent:
- Same webhook event processed multiple times = same result
- Tracked by `event_id` in database
- Safe to retry failed webhook deliveries

---

## 📊 Rate Limiting Headers

Responses include rate limit information:

```
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 28
X-RateLimit-Reset: 1234567890
```

When rate limited (429):

```json
{
  "error": {
    "message": "Çok fazla istek gönderdiniz. 5 saniye bekleyiniz.",
    "retryAfter": 5,
    "resetTime": "2024-07-24T12:05:30.000Z"
  }
}
```

---

## 📦 Request/Response Sizes

- **Max Request Body:** 20MB (for image base64)
- **Max Image Size:** 5MB (base64 encoded)
- **Max Response Size:** ~1MB (metadata JSON)

---

## 🧪 Testing

### Health Check
```bash
curl http://localhost:3001/health | jq
```

### Generate Metadata (Development)
```bash
# Get token first (Supabase)
TOKEN="eyJhbGc..."

# Send image
curl -X POST http://localhost:3001/api/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEA...",
    "categoryKey": "decor",
    "language": "tr"
  }'
```

### Test Rate Limiting
```bash
# Should work (30 per 15 minutes)
for i in {1..5}; do curl http://localhost:3001/api/generate; done

# Should get rate limited after 30 requests
for i in {1..50}; do curl http://localhost:3001/api/generate; done
```

---

## 📚 SDKs & Libraries

### JavaScript/TypeScript
```javascript
import { supabase } from './supabase.js';

// Get session
const { data: { session } } = await supabase.auth.getSession();

// Make API call
const response = await fetch('/api/generate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    imageData: base64Image,
    categoryKey: 'decor',
    language: 'tr'
  })
});
```

### Python (Future)
```python
import requests

response = requests.post(
  'https://api.mayalisting.com/api/generate',
  headers={'Authorization': f'Bearer {token}'},
  json={
    'imageData': base64_image,
    'categoryKey': 'decor',
    'language': 'tr'
  }
)
```

---

## 🔄 API Versioning

Current version: **v1** (stable)

Future versions will use `/api/v2/`, `/api/v3/`, etc.

---

## 🚀 Deployment

See `DEPLOYMENT_GUIDE.md` for production setup.

---

## 📞 Support

- **Documentation:** https://docs.mayalisting.com
- **Issues:** Create issue on GitHub
- **Email:** support@mayalisting.com

Last updated: 2024-07-24
API Version: 1.0.0
