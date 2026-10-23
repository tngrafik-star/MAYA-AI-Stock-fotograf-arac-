// Request validation and AI error classification for the API server.

import Joi from 'joi';

// Validation Schemas
export const generateSchema = Joi.object({
  // Frontend, görseli "data:image/...;base64,...." data-URL formatında
  // "base64DataUrl" alanıyla gönderir. Bu bir data-URL'dir (saf base64 değil),
  // bu yüzden Joi.base64() KULLANMA — aksi halde geçerli istekler reddedilir.
  base64DataUrl: Joi.string().required().messages({
    'string.empty': 'Görsel verisi gerekli',
    'any.required': 'Görsel verisi gerekli'
  }),
  categoryKey: Joi.string().required().messages({
    'string.empty': 'Kategori gerekli'
  }),
  customApiKey: Joi.string().allow(null, '').optional(),
  plan: Joi.string().valid('free', 'starter', 'pro', 'studio').default('starter').messages({
    'any.only': 'Plan türü geçersiz'
  }),
  language: Joi.string().valid('en', 'tr').default('tr').messages({
    'any.only': 'Dil geçersiz'
  })
});

export const checkoutSessionSchema = Joi.object({
  plan: Joi.string().valid('free', 'starter', 'pro', 'studio').required().messages({
    'any.only': 'Plan türü geçersiz',
    'string.empty': 'Plan gerekli'
  }),
  userId: Joi.string().uuid().required().messages({
    'string.guid': 'Kullanıcı ID geçersiz'
  }),
  billingCycle: Joi.string().valid('monthly', 'yearly').optional(),
  successUrl: Joi.string().uri().optional(),
  cancelUrl: Joi.string().uri().optional()
});

// Gemini API Error Handler
export const handleGeminiError = (status, errorData) => {
  const message = errorData?.error?.message || '';
  // Gemini capitalizes these ("Quota exceeded", "RESOURCE_EXHAUSTED")
  const lowerMessage = message.toLowerCase();

  // Classify error type
  if (status === 429) {
    return {
      status: 429,
      userMessage: 'Çok fazla istek gönderdiniz. Lütfen birkaç saniye sonra tekrar deneyin.',
      type: 'RATE_LIMIT',
      retriable: true
    };
  }

  if (status === 403 || lowerMessage.includes('quota') || lowerMessage.includes('resource_exhausted')) {
    return {
      status: 403,
      userMessage: 'API quota aşılmıştır. Lütfen daha sonra tekrar deneyin.',
      type: 'QUOTA_EXCEEDED',
      retriable: false
    };
  }

  if (status === 400 || lowerMessage.includes('invalid')) {
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

// ---------------------------------------------------------------------------
// Cost and abuse guards
// ---------------------------------------------------------------------------

// The app sends a 1024px JPEG (~100-300 KB). Anything far larger costs more
// Gemini tokens and is not coming from our client.
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** Returns { mimeType, data } or { error: { status, message } }. */
export const parseImageDataUrl = (dataUrl) => {
  const match = /^data:(image\/[a-zA-Z+.-]+);base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl || ''));
  if (!match) {
    return { error: { status: 400, message: 'Geçersiz resim formatı.' } };
  }
  const mimeType = match[1].toLowerCase();
  if (!ALLOWED_IMAGE_TYPES.includes(mimeType)) {
    return { error: { status: 415, message: 'Yalnızca JPG, PNG veya WEBP görseller kabul edilir.' } };
  }
  const sizeBytes = Math.floor((match[2].length * 3) / 4);
  if (sizeBytes > MAX_IMAGE_BYTES) {
    return { error: { status: 413, message: `Görsel çok büyük (${(sizeBytes / 1024 / 1024).toFixed(1)} MB). En fazla 2 MB olabilir.` } };
  }
  return { mimeType, data: match[2] };
};

/**
 * Caps billed output: Gemini 2.5 bills "thinking" tokens as output. Flash runs
 * without thinking; Pro cannot turn it off, so it gets a small budget.
 */
export const geminiGenerationConfig = (modelName, { json = true, maxOutputTokens = 4096 } = {}) => ({
  ...(json ? { responseMimeType: 'application/json' } : {}),
  maxOutputTokens,
  thinkingConfig: { thinkingBudget: modelName.includes('pro') ? 512 : 0 }
});

/** Client IP as Vercel/proxies report it. */
export const clientIp = (headers = {}) => {
  const forwarded = String(headers['x-forwarded-for'] || '').split(',')[0].trim();
  return String(headers['x-real-ip'] || '').trim() || forwarded || null;
};

/** Maps a consume_generation refusal to an HTTP response. */
export const consumeRefusal = (reason) => {
  switch (reason) {
    case 'email_not_confirmed':
      return { status: 403, type: 'EMAIL_NOT_CONFIRMED', message: 'Analiz yapabilmek için e-posta adresinizi doğrulayın. Gelen kutunuzdaki onay bağlantısına tıklayın.' };
    case 'monthly_limit':
      return { status: 402, type: 'LIMIT_REACHED', message: 'Bu ayki analiz hakkınız doldu. Daha fazlası için planınızı yükseltin.' };
    case 'daily_limit':
      return { status: 429, type: 'DAILY_LIMIT', message: 'Bugünkü analiz sınırına ulaştınız. Yarın tekrar deneyebilirsiniz.' };
    case 'ip_limit':
      return { status: 429, type: 'IP_LIMIT', message: 'Bu ağdan bugün ücretsiz planla çok fazla analiz yapıldı. Yarın tekrar deneyin ya da bir plana geçin.' };
    case 'service_busy':
      return { status: 503, type: 'SERVICE_BUSY', message: 'Servis bugün yoğun. Lütfen daha sonra tekrar deneyin.' };
    case 'no_profile':
    default:
      return { status: 403, type: 'NO_PROFILE', message: 'Hesap profili bulunamadı. Lütfen çıkış yapıp tekrar giriş yapın.' };
  }
};

// Senders that must never get an AI auto-reply (prevents mail loops)
const AUTOMATED_SENDER = /(no-?reply|do-?not-?reply|mailer-daemon|postmaster|bounce|notifications?@|auto-?confirm)/i;
const AUTOMATED_SUBJECT = /^(auto(matic)? ?reply|otomatik yan[ıi]t|out of office|ofis d[ıi][şs][ıi]nda|undeliverable|delivery status|returned mail|teslim edilemedi)/i;

/** Returns a reason string when an inbound email must not be auto-answered. */
export const skipAutoReplyReason = ({ fromEmail, subject, ownAddress, headers = {} }) => {
  const autoSubmitted = String(headers['auto-submitted'] || headers['Auto-Submitted'] || '').toLowerCase();
  const precedence = String(headers.precedence || headers.Precedence || '').toLowerCase();
  if (!fromEmail || !fromEmail.includes('@')) return 'invalid_sender';
  if (ownAddress && fromEmail.toLowerCase() === ownAddress.toLowerCase()) return 'own_address';
  if (AUTOMATED_SENDER.test(fromEmail)) return 'automated_sender';
  if (autoSubmitted && autoSubmitted !== 'no') return 'auto_submitted';
  if (['bulk', 'junk', 'list', 'auto_reply'].includes(precedence)) return 'bulk_precedence';
  if (AUTOMATED_SUBJECT.test(String(subject || '').trim())) return 'automated_subject';
  if (/^(re:\s*){3,}/i.test(String(subject || '').trim())) return 'reply_chain';
  return null;
};
