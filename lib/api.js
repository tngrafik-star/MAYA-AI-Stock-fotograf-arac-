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
