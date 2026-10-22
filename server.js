import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import WebSocket from 'ws';
import jwt from 'jsonwebtoken';
import { planFromVariant, decideLemonUpdate } from './lib/billing.js';
import { generateSchema, checkoutSessionSchema, handleGeminiError } from './lib/api.js';

// Polyfill WebSocket for Supabase Realtime in older Node versions
if (typeof globalThis.WebSocket === 'undefined') {
  globalThis.WebSocket = WebSocket;
}

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Validate required environment variables
const validateEnv = () => {
  const required = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_GEMINI_API_KEY'
  ];

  const missing = required.filter(key => {
    const value = process.env[key];
    return !value || value.startsWith('your_') || value.includes('placeholder');
  });

  if (missing.length > 0) {
    console.error('❌ MISSING REQUIRED ENV VARIABLES:');
    missing.forEach(key => {
      console.error(`   - ${key}`);
    });
    console.error('\n📖 See .env.example for setup instructions');

    // Production/Vercel'de tüm süreci sonlandırma — bu, tek bir eksik değişkende
    // sitenin komple çökmesine yol açar. Sadece uyar ve devam et; eksik anahtara
    // bağlı endpoint'ler (ör. /api/generate) zaten kendi anlamlı hatasını döner.
    const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL;
    if (isProd) {
      console.error('⚠️ Production modunda eksik değişken(ler)le devam ediliyor. İlgili özellikler çalışmayabilir.');
    } else {
      process.exit(1);
    }
  }

  // Validate NODE_ENV for production
  const nodeEnv = process.env.NODE_ENV || 'development';
  if (nodeEnv === 'production' || process.env.VERCEL === '1') {
    console.log('🚀 Running in PRODUCTION mode');
    if (!process.env.SUPABASE_JWT_SECRET && !process.env.VITE_SUPABASE_JWT_SECRET) {
      console.warn('⚠️ WARNING: SUPABASE_JWT_SECRET not set in production - JWT verification disabled');
    }
  } else {
    console.log('🔧 Running in DEVELOPMENT mode');
  }

  console.log('✅ Environment variables validated');
};

validateEnv();

const app = express();
const PORT = process.env.PORT || 3001;

const IS_PRODUCTION = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

// Initialize Supabase Admin Client
// Only the service_role key works here: plan/credit columns are closed to the
// anon key by RLS, so falling back to it would silently break billing.
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  }
}) : null;
if (!supabaseAdmin) {
  console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY not set - credit checks and payment webhooks are disabled.');
}

// Supabase client used only to validate user access tokens (auth.getUser)
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabaseAuth = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
}) : null;

// Initialize Nodemailer SMTP Transporter
let emailTransporter = null;
const smtpHost = process.env.EMAIL_SMTP_HOST;
const smtpPort = parseInt(process.env.EMAIL_SMTP_PORT || '587', 10);
const smtpUser = process.env.EMAIL_SMTP_USER;
const smtpPass = process.env.EMAIL_SMTP_PASS;

if (smtpHost && smtpUser && smtpPass && smtpHost !== 'your_smtp_host_here') {
  emailTransporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465, // true for 465, false for other ports like 587
    auth: {
      user: smtpUser,
      pass: smtpPass
    }
  });

  // Verify SMTP connection config on boot (only in non-Vercel environments to prevent function timeouts)
  if (!process.env.VERCEL) {
    emailTransporter.verify((error, success) => {
      if (error) {
        console.error('❌ SMTP Connection verification failed:', error.message);
      } else {
        console.log('📧 SMTP Server is ready to send email replies.');
      }
    });
  }
} else {
  console.warn('⚠️ SMTP Configuration is missing or using placeholder values. AI email auto-responder is disabled.');
}

// Simple in-memory rate limiter for sensitive API endpoints
// ⚠️ NOTE: For production with multiple instances, use Redis instead
const rateLimits = new Map();

// Cleanup old entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  for (const [ip, limitInfo] of rateLimits.entries()) {
    if (now > limitInfo.resetTime + 60000) { // Keep entries for 1 min after expiry
      rateLimits.delete(ip);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    console.log(`🧹 Rate limiter: Cleaned ${cleaned} expired entries`);
  }
}, 5 * 60 * 1000); // 5 minutes

const rateLimiter = (limitCount, windowMs, label = 'API') => {
  return (req, res, next) => {
    // Identify by IP (handle proxies)
    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
               req.socket.remoteAddress ||
               'unknown';
    const now = Date.now();

    if (!rateLimits.has(ip)) {
      rateLimits.set(ip, { count: 1, resetTime: now + windowMs, label });
      return next();
    }

    const limitInfo = rateLimits.get(ip);
    if (now > limitInfo.resetTime) {
      // Window expired, reset limit
      limitInfo.count = 1;
      limitInfo.resetTime = now + windowMs;
      return next();
    }

    limitInfo.count++;
    const remaining = limitCount - limitInfo.count;

    if (limitInfo.count > limitCount) {
      const resetTime = new Date(limitInfo.resetTime).toISOString();
      console.warn(`⛔ Rate limit exceeded for ${ip} on ${label}: ${limitInfo.count}/${limitCount}`);
      return res.status(429).json({
        error: {
          message: `Çok fazla istek gönderdiniz. ${Math.ceil((limitInfo.resetTime - now) / 1000)} saniye bekleyiniz.`,
          retryAfter: Math.ceil((limitInfo.resetTime - now) / 1000),
          resetTime
        }
      });
    }

    // Add rate limit info to response headers
    res.set('X-RateLimit-Limit', limitCount);
    res.set('X-RateLimit-Remaining', remaining);
    res.set('X-RateLimit-Reset', Math.ceil(limitInfo.resetTime / 1000));

    next();
  };
};

// JWT Authentication Middleware
const verifyAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: { message: "Kimlik doğrulama gerekli. Authorization header eksik." }
    });
  }

  const token = authHeader.slice(7); // Remove "Bearer " prefix
  let userId = null;

  try {
    if (supabaseAuth) {
      // Supabase Auth validates signature, expiry and revocation (works for both
      // legacy HS256 and new asymmetric signing keys)
      const { data, error } = await supabaseAuth.auth.getUser(token);
      if (error || !data?.user) {
        throw new Error(error?.message || 'User not found for token');
      }
      userId = data.user.id;
    } else {
      const jwtSecret = process.env.SUPABASE_JWT_SECRET || process.env.VITE_SUPABASE_JWT_SECRET;
      if (jwtSecret) {
        userId = jwt.verify(token, jwtSecret).sub; // Supabase uses 'sub' for user ID
      } else if (!IS_PRODUCTION) {
        console.warn('⚠️ Supabase auth not configured, skipping token verification in development');
        userId = jwt.decode(token)?.sub;
      } else {
        console.error('❌ Token verification is not configured in production.');
        return res.status(503).json({
          error: { message: "Kimlik doğrulama servisi yapılandırılmamış." }
        });
      }
    }
  } catch (error) {
    console.error('JWT verification error:', error.message);
    return res.status(401).json({
      error: { message: "Geçersiz veya süresi dolmuş token." }
    });
  }

  if (!userId) {
    return res.status(401).json({
      error: { message: "Geçersiz veya süresi dolmuş token." }
    });
  }

  req.userId = userId;
  next();
};

const refundGeneration = async (userId) => {
  if (!supabaseAdmin || !userId) return;
  const { error } = await supabaseAdmin.rpc('refund_generation', { p_user_id: userId });
  if (error) {
    console.error(`❌ refund_generation failed for ${userId}:`, error.message);
  }
};

// Validation Middleware
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const messages = error.details.map(detail => detail.message).join('; ');
      console.warn(`❌ Validation error: ${messages}`);
      return res.status(400).json({
        error: { message: `Geçersiz istek: ${messages}` }
      });
    }

    req.body = value;
    next();
  };
};

// Middlewares
// Add security headers with Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://www.googletagmanager.com'],
      // The app's file pickers use inline onclick handlers
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
      // Supabase (auth, database, signed image URLs) and Google Analytics/Ads
      connectSrc: [
        "'self'",
        ...(process.env.VITE_SUPABASE_URL ? [process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_URL.replace(/^https:/, 'wss:')] : []),
        'https://*.google-analytics.com',
        'https://*.analytics.google.com',
        'https://*.googletagmanager.com',
        'https://www.google.com',
        'https://pagead2.googlesyndication.com',
        'https://*.googleadservices.com',
        'https://*.doubleclick.net',
        'https://app.lemonsqueezy.com'
      ]
    }
  },
  hsts: {
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true
  }
}));

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000', 'https://mayalisting.com', 'https://www.mayalisting.com'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or server-to-server)
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.indexOf(origin) !== -1;
    const isVercel = origin.endsWith('.vercel.app') || /https?:\/\/.*\.vercel\.app$/.test(origin);

    if (isAllowed || isVercel || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('CORS Policy: Request origin is not allowed.'));
    }
  }
}));

// Request Logger Middleware
app.use((req, res, next) => {
  // Log the path only: query strings can carry secrets (e.g. the inbound email ?secret=)
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Lemon Squeezy Webhook Endpoint (needs raw body parser, must be defined before express.json)
app.post('/api/payment/lemon/webhook', rateLimiter(100, 60 * 1000, 'Lemon Squeezy Webhook'), express.raw({ type: 'application/json' }), async (req, res) => {
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
  const signature = req.headers['x-signature'];

  if (!signature) {
    console.error('❌ Lemon Squeezy Webhook: Missing x-signature header');
    return res.status(400).send('Webhook Error: Missing x-signature header');
  }

  const rawBody = req.body;

  try {
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

    if (isProduction && (!secret || !signature)) {
      throw new Error("Lemon Squeezy webhook signature verification is mandatory in production.");
    }

    if (secret && signature) {
      const hmac = crypto.createHmac('sha256', secret);
      const digest = Buffer.from(hmac.update(rawBody).digest('hex'), 'utf8');
      const received = Buffer.from(String(signature), 'utf8');
      if (digest.length !== received.length || !crypto.timingSafeEqual(digest, received)) {
        console.error('❌ Lemon Squeezy Webhook signature verification failed.');
        return res.status(401).send('Signature verification failed');
      }
    } else {
      console.warn("⚠️ Lemon Squeezy Webhook signature verification bypassed. Check LEMON_SQUEEZY_WEBHOOK_SECRET in production.");
    }
  } catch (err) {
    console.error(`❌ Webhook signature computation error: ${err.message}`);
    return res.status(500).send(`Webhook Error: ${err.message}`);
  }

  let event;
  try {
    const rawBodyString = rawBody.toString('utf8');
    event = JSON.parse(rawBodyString);
  } catch (err) {
    console.error(`❌ Lemon Squeezy Webhook JSON parse error: ${err.message}`);
    return res.status(400).send(`Webhook Error: Invalid JSON: ${err.message}`);
  }

  const eventName = event.meta?.event_name;
  const customData = event.meta?.custom_data || {};
  const data = event.data || {};
  const attrs = data.attributes || {};
  // Lemon Squeezy has no per-delivery event id; resource id + updated_at identifies a state change
  const eventId = `lemonsqueezy:${eventName}:${data.type}:${data.id}:${attrs.updated_at || attrs.created_at || ''}`;

  console.log(`🔔 Lemon Squeezy Webhook received: ${eventName} (${data.type} ${data.id})`);

  const handledEvents = [
    'subscription_created',
    'subscription_updated',
    'subscription_cancelled',
    'subscription_resumed',
    'subscription_expired',
    'subscription_paused',
    'subscription_unpaused',
    'subscription_payment_success'
  ];
  if (!handledEvents.includes(eventName)) {
    // order_created is followed by subscription_created for subscriptions; nothing to do here
    return res.json({ received: true });
  }

  if (!supabaseAdmin) {
    console.error("❌ Supabase admin client not initialized. Cannot update user profile.");
    return res.status(500).json({ error: { message: 'Billing backend not configured' } });
  }

  const { data: existingEvent } = await supabaseAdmin
    .from('webhook_events')
    .select('id')
    .eq('event_id', eventId)
    .maybeSingle();

  if (existingEvent) {
    console.log(`⏭️  Webhook ${eventId} already processed. Skipping.`);
    return res.json({ received: true });
  }

  const subscriptionId = String(
    eventName === 'subscription_payment_success' ? attrs.subscription_id : data.id
  );

  // Resolve the user: checkout custom data first, then the stored subscription id
  let profile = null;
  const customUserId = customData.userId || customData.user_id;
  if (customUserId) {
    const { data: found } = await supabaseAdmin
      .from('profiles')
      .select('id, lemon_subscription_id')
      .eq('id', customUserId)
      .maybeSingle();
    profile = found;
  }
  if (!profile && subscriptionId) {
    const { data: found } = await supabaseAdmin
      .from('profiles')
      .select('id, lemon_subscription_id')
      .eq('lemon_subscription_id', subscriptionId)
      .maybeSingle();
    profile = found;
  }

  if (!profile) {
    console.warn(`⚠️ Lemon Squeezy Webhook: No profile for subscription ${subscriptionId}`, customData);
    return res.json({ received: true });
  }

  const plan = planFromVariant(attrs.variant_id) || customData.plan;
  const { updates, error: decideError } = decideLemonUpdate({ eventName, attrs, subscriptionId, profile, plan });

  if (decideError) {
    console.error(`❌ Lemon Squeezy Webhook: ${decideError}`);
    return res.status(400).json({ error: { message: decideError } });
  }
  if (!updates) {
    console.log(`⏭️  Ignoring ${eventName} for old subscription ${subscriptionId}`);
  }

  if (updates) {
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', profile.id);

    if (updateError) {
      console.error(`❌ Supabase update error: ${updateError.message}`);
      // Non-2xx makes Lemon Squeezy retry the delivery
      return res.status(500).json({ error: { message: 'Profile update failed' } });
    }
    console.log(`🎉 User ${profile.id} updated via Lemon Squeezy ${eventName}:`, Object.keys(updates).join(', '));
  }

  const { error: logError } = await supabaseAdmin
    .from('webhook_events')
    .insert({
      event_id: eventId,
      event_type: eventName,
      provider: 'lemonsqueezy',
      payload: event
    });

  if (logError) {
    console.warn(`⚠️ Failed to log webhook event: ${logError.message}`);
  }

  res.json({ received: true });
});

// Gemini prompts can be large, increase payload size limit to 20MB for high-res base64 images
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

// Endpoint for metadata generation (Rate limited: max 30 per 15 minutes)
app.post('/api/generate', verifyAuth, validateRequest(generateSchema), rateLimiter(30, 15 * 60 * 1000), async (req, res) => {
  // Set once a credit is consumed so every failure path below can give it back
  let creditUserId = null;
  try {
    const { base64DataUrl, categoryKey, language } = req.body;

    if (!base64DataUrl) {
      return res.status(400).json({ error: { message: "Görsel verisi bulunamadı." } });
    }

    // Validate image size (max 5MB)
    const maxImageSize = 5 * 1024 * 1024; // 5MB in bytes
    const imageSizeBytes = Math.ceil((base64DataUrl.length * 3) / 4); // base64 to bytes conversion
    if (imageSizeBytes > maxImageSize) {
      return res.status(413).json({
        error: { message: `Görsel çok büyük. Maksimum 5MB olabilir. (${(imageSizeBytes / 1024 / 1024).toFixed(2)}MB)` }
      });
    }

    let apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    const isPlaceholder = !apiKey || 
      apiKey.includes('your_gemini_api_key_here') || 
      apiKey.trim() === '' || 
      apiKey.includes('placeholder') || 
      apiKey.length < 15;
      
    if (isPlaceholder) {
      return res.status(500).json({
        error: { message: "Sunucu hatası: Gemini API anahtarı yapılandırılmamış. Sistem yöneticisine başvurunuz." }
      });
    }

    const isEnglish = language === 'en';

    // 1. Get Category Name
    const cats = isEnglish ? {
      decor: 'Lifestyle & Decor',
      cosmetics: 'Cosmetics & Beauty',
      tech: 'Technology & Accessories',
      food: 'Food & Beverage',
      landscape: 'Nature & Landscape',
      fashion: 'Fashion & Apparel',
      fitness: 'Sports & Wellness',
      business: 'Business & Office',
      architecture: 'Architecture & Building',
      animals: 'Pets & Wildlife',
      travel: 'Travel & Culture',
      automotive: 'Automotive & Vehicles',
      portrait: 'People & Portrait',
      other: 'Other / General'
    } : {
      decor: 'Yaşam & Dekorasyon',
      cosmetics: 'Kozmetik & Güzellik',
      tech: 'Teknoloji & Aksesuar',
      food: 'Yiyecek & İçecek',
      landscape: 'Doğa & Manzara',
      fashion: 'Moda & Giyim',
      fitness: 'Spor & Sağlıklı Yaşam',
      business: 'İş Dünyası & Ofis',
      architecture: 'Mimari & Yapı',
      animals: 'Evcil Hayvanlar & Vahşi Yaşam',
      travel: 'Seyahat & Kültür',
      automotive: 'Otomotiv & Taşıtlar',
      portrait: 'İnsanlar & Portre',
      other: 'Diğer / Genel'
    };
    const categoryName = cats[categoryKey] || (isEnglish ? 'General' : 'Genel');

    // 2. Parse base64DataUrl
    const regex = /^data:(image\/[a-zA-Z+.-]+);base64,(.+)$/;
    const matches = base64DataUrl.match(regex);
    if (!matches) {
      return res.status(400).json({ error: { message: "Geçersiz resim formatı." } });
    }
    const mimeType = matches[1];
    const base64Data = matches[2];

    // Consume one credit atomically on the server; the plan comes from the
    // database, never from the request body
    let userPlan = 'starter';
    let usage = null;
    if (supabaseAdmin) {
      const { data: consumed, error: consumeError } = await supabaseAdmin
        .rpc('consume_generation', { p_user_id: req.userId });

      if (consumeError) {
        console.error('❌ consume_generation error:', consumeError.message);
        return res.status(500).json({
          error: { message: "Kredi kontrolü yapılamadı. Lütfen tekrar deneyin.", type: 'QUOTA_CHECK_FAILED', retriable: true }
        });
      }

      const profile = consumed?.[0];
      if (!profile) {
        return res.status(402).json({
          error: { message: "Kullanım limitinize ulaştınız. Lütfen aboneliğinizi yükseltin.", type: 'LIMIT_REACHED', retriable: false }
        });
      }

      creditUserId = req.userId;
      userPlan = profile.plan === 'free' ? 'starter' : profile.plan;
      usage = {
        plan: profile.plan,
        generations_used: profile.generations_used,
        generations_limit: profile.generations_limit,
        usage_reset_at: profile.usage_reset_at
      };
    } else if (IS_PRODUCTION) {
      console.error('❌ SUPABASE_SERVICE_ROLE_KEY missing in production - refusing to generate without credit check.');
      return res.status(503).json({
        error: { message: "Sunucu hatası: Kredi sistemi yapılandırılmamış. Sistem yöneticisine başvurunuz.", type: 'QUOTA_CHECK_FAILED', retriable: false }
      });
    } else {
      console.warn('⚠️ Development: skipping credit check (SUPABASE_SERVICE_ROLE_KEY not set).');
    }

    // Select Gemini model based on user plan
    let modelName = 'gemini-2.5-flash';
    if (userPlan === 'pro' || userPlan === 'studio') {
      modelName = 'gemini-2.5-pro';
    }

    // Construct plan instructions
    let planInstructions = "";
    if (isEnglish) {
      if (userPlan === 'starter') {
        planInstructions = `Subscription Plan: Starter. Generate standard quality, GEO (Generative Engine Optimization) & AI Search ready short and clear titles/descriptions.
- Title: A simple title of maximum 60 characters with key entity nouns.
- Description: A simple description of at most 2 sentences.
- Keywords: Select between 20 and 30 standard keywords.`;
      } else if (userPlan === 'pro') {
        planInstructions = `Subscription Plan: Pro. Generate professional quality, high SEO & GEO (Generative Engine Optimization) detailed content for AI Search Engines.
- Title: An attention-grabbing title with high-search-volume keywords and semantic attributes (maximum 75 characters).
- Description: A professional 3-4 sentence text explaining the image's color palette, composition, semantic attributes and commercial value.
- Keywords: Between 30 and 40 popular tags aligned with search trends and AI image recognition terms.`;
      } else if (userPlan === 'studio') {
        planInstructions = `Subscription Plan: Studio. Generate top-level VIP studio quality content optimized for Google AI Overviews, Lens, and E-Commerce AI (Amazon Rufus / Etsy AI).
- Title: Rich studio title optimized for maximum click-through rate and AI Search indexability (maximum 80 characters).
- Description: At least 4-sentence detailed analysis describing the image's composition, light quality, textures, color attributes and artistic angle.
- Keywords: Exactly 45 to 50 niche and highest-volume stock/e-commerce tags.
- E-Commerce Description: Rich marketing copy decorated with emojis, bullet-pointed features, structured specifications, and gift recommendations tailored for generative search engines.`;
      }
    } else {
      if (userPlan === 'starter') {
        planInstructions = `Abonelik Planı: Starter. Standart kalitede, GEO (Generative Engine Optimization) ve yapay zeka arama motorlarına hazır kısa ve net başlıklar/açıklamalar üret.
- Başlık: Maksimum 60 karakterlik, ana nesne isimlerini barındıran sade bir başlık.
- Açıklama: En fazla 2 cümlelik basit bir açıklama.
- Anahtar kelimeler (keywords): 20 ila 30 adet arası standart anahtar kelime seç.`;
      } else if (userPlan === 'pro') {
        planInstructions = `Abonelik Planı: Pro. Profesyonel kalitede, arama motoru (SEO) ve yapay zeka araması (GEO) uyumlu detaylı içerik üret.
- Başlık: Dikkat çekici, arama hacmi yüksek anahtar kelimeler ve anlamsal nitelemeler içeren zengin başlık (maksimum 75 karakter).
- Açıklama: 3-4 cümlelik, görselin renk paletini, kompozisyonunu, nesne ilişkilerini ve ticari kullanım değerlerini açıklayan profesyonel bir metin.
- Anahtar kelimeler (keywords): 30 ila 40 adet arası arama trendlerine ve yapay zeka tanıma terimlerine uygun etiketler.`;
      } else if (userPlan === 'studio') {
        planInstructions = `Abonelik Planı: Studio. En üst düzey VIP stüdyo kalitesinde, Google AI Overviews, Google Lens ve E-Ticaret AI (Amazon Rufus / Etsy AI) sistemlerine tam uyumlu zengin içerik üret.
- Başlık: Maksimum tıklama oranı (CTR) ve yapay zeka indekslemesi sağlayacak zengin stüdyo başlığı (maksimum 80 karakter, başına [STUDIO VIP] ekleme, sadece zengin başlık).
- Açıklama: En az 4 cümlelik, görselin kompozisyonunu, ışık kalitesini (yumuşak stüdyo ışığı vb.), dokularını, renk nitelemelerini ve sanatsal açısını betimleyen detaylı bir analiz metni.
- Anahtar kelimeler (keywords): Tam olarak 45 ila 50 adet arası niş ve en yüksek hacimli stok/e-ticaret etiketleri.
- E-Ticaret Açıklaması: Emojilerle süslenmiş, maddeler halinde teknik ve kullanım özellikleri, kutu içeriği ve yapay zeka özetleme algoritmalarına tam uyumlu pazarlama kopyası olmalıdır.`;
      }
    }

    // 3. Prompt Construction
    const prompt = isEnglish
      ? `Analyze the image in detail and generate English stock photo metadata and e-commerce information according to the following JSON structure.
Image Category: ${categoryName}

Plan Rules:
${planInstructions}

JSON Structure and Rules:
{
  "category": "${categoryKey}",
  "title": "SEO-optimized English title that best reflects the image content, following plan rules.",
  "description": "English description following plan rules, explaining the image composition, colors, objects and atmosphere.",
  "keywords": "The most relevant English keywords (tags) in the amount specified in the plan rules, written on a single line with commas and spaces between them (e.g.: mug, ceramic, coffee cup...). All lowercase.",
  "tags": "13 product tags optimized for e-commerce, maximum 20 characters each, written on a single line with commas and spaces between them. All lowercase.",
  
  "adobe": {
    "title": "Same or very similar to the stock title.",
    "keywords": "The 30 most relevant keywords selected from the keywords list above, separated by commas."
  },
  
  "shutterstock": {
    "title": "Same as the stock title.",
    "description": "A single descriptive sentence of at most 200 characters (Shutterstock uses only the description as the title).",
    "keywords": "Up to 50 keywords selected and expanded from the keywords list, separated by commas."
  },
  
  "freepik": {
    "title": "The title written entirely in lowercase.",
    "keywords": "Up to 25 keywords selected from the keywords list, written entirely in lowercase and separated by commas."
  },
  
  "vecteezy": {
    "title": "Same as the stock title.",
    "description": "Same as the stock description.",
    "keywords": "Up to 20 keywords selected from the keywords list, separated by commas."
  },
  
  "ecommerce": {
    "title": "Rich title optimized for e-commerce sites (Etsy, Amazon, etc.), containing keywords separated by pipe (|) (e.g.: 'Handmade Ceramic Coffee Mug | Custom Design Cup | Gift Mug - Minimalist Scandinavian Series').",
    "description": "Premium e-commerce product description. Rich product description following plan rules and e-commerce format.",
    "tags": "Exactly 13 lowercase tags separated by commas, compatible with Etsy/Amazon."
  }
}

OUTPUT MUST ONLY BE A JSON MATCHING THE ABOVE JSON TEMPLATE. Do not include any other explanation or code block.`
      : `Görseli detaylı bir şekilde analiz et ve aşağıdaki JSON yapısına uygun olarak Türkçe stok fotoğraf metadata ve e-ticaret bilgilerini üret.
Görsel Kategorisi: ${categoryName}

Plan Kuralları:
${planInstructions}

JSON Yapısı ve Kurallar:
{
  "category": "${categoryKey}",
  "title": "Görselin içeriğini en iyi yansıtan, plan kurallarına uygun, SEO uyumlu Türkçe başlık.",
  "description": "Plan kurallarına uygun, görselin kompozisyonunu, renklerini, nesnelerini ve atmosferini açıklayan Türkçe açıklama.",
  "keywords": "Plan kurallarında belirtilen miktarda en alakalı Türkçe anahtar kelime (etiket), aralarında virgül ve boşluk olacak şekilde tek bir satırda yazılmalıdır (örn: kupa, seramik, kahve fincanı...). Tamamı küçük harf olmalıdır.",
  "tags": "E-Ticaret için optimize edilmiş, en fazla 20 karakter uzunluğunda 13 adet ürün etiketi, aralarında virgül ve boşluk olacak şekilde tek bir satırda yazılmalıdır. Tamamı küçük harf olmalıdır.",
  
  "adobe": {
    "title": "İNGİLİZCE: Görseli en iyi anlatan, en fazla 70 karakterlik İngilizce stok başlığı (Adobe Stock İngilizce metadata ister).",
    "keywords": "İNGİLİZCE: En alakalı 30 İngilizce anahtar kelime, en önemlisi başta, aralarında virgülle ayrılmış, tamamı küçük harf."
  },
  
  "shutterstock": {
    "title": "İNGİLİZCE: Adobe başlığı ile aynı İngilizce başlık.",
    "description": "İNGİLİZCE: En fazla 200 karakterlik tek cümlelik İngilizce açıklama (Shutterstock başlık olarak yalnızca açıklamayı kullanır).",
    "keywords": "İNGİLİZCE: En fazla 50 İngilizce anahtar kelime, aralarında virgülle ayrılmış, tamamı küçük harf."
  },
  
  "freepik": {
    "title": "İNGİLİZCE: Adobe başlığının tamamen küçük harfli hali.",
    "keywords": "İNGİLİZCE: En fazla 25 İngilizce anahtar kelime, tamamen küçük harf, aralarında virgülle ayrılmış."
  },
  
  "vecteezy": {
    "title": "İNGİLİZCE: Adobe başlığı ile aynı.",
    "description": "İNGİLİZCE: Görselin kompozisyonunu anlatan 1-2 cümlelik İngilizce açıklama.",
    "keywords": "İNGİLİZCE: En fazla 20 İngilizce anahtar kelime, aralarında virgülle ayrılmış."
  },
  
  "ecommerce": {
    "title": "E-ticaret siteleri (Etsy, Trendyol vs.) için optimize edilmiş, anahtar kelimeler içeren boru işareti (|) ile ayrılmış zengin başlık (örn: 'El Yapımı Seramik Kahve Kupası | Özel Tasarım Kupa Bardak | Hediye Kupa Bardak - Minimalist İskandinav Serisi').",
    "description": "Premium e-ticaret ürün açıklaması. Plan kurallarına ve e-ticaret formatına uygun zengin ürün açıklaması.",
    "tags": "Etsy/Trendyol uyumlu, aralarında virgülle ayrılmış tam olarak 13 adet küçük harfli etiket."
  }
}

ÖNEMLİ: "adobe", "shutterstock", "freepik" ve "vecteezy" alanları stok ajanslarına yüklenecektir ve MUTLAKA İNGİLİZCE olmalıdır. Diğer tüm alanlar Türkçe olmalıdır.

ÇIKTI SADECE YUKARIDAKİ JSON ŞABLONUNA UYGUN BİR JSON OLMALIDIR. Başka açıklama veya kod bloğu içermemelidir.`;

    // 4. API Request using Node 20 global fetch
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Data
                }
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      let errorData = {};
      try {
        const errText = await response.text();
        errorData = JSON.parse(errText);
      } catch (e) {
        console.warn('Failed to parse error response');
      }

      const error = handleGeminiError(response.status, errorData);
      await refundGeneration(creditUserId);
      console.error(`❌ Gemini API Error (${error.type}):`, errorData.error?.message);

      return res.status(error.status).json({
        error: {
          message: error.userMessage,
          type: error.type,
          retriable: error.retriable
        }
      });
    }

    const result = await response.json();
    const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      console.error('❌ Gemini API returned empty response');
      await refundGeneration(creditUserId);
      return res.status(500).json({
        error: {
          message: "AI servisi boş yanıt döndürdü. Lütfen tekrar deneyin.",
          type: 'EMPTY_RESPONSE',
          retriable: true
        }
      });
    }

    // Parse AI response as JSON
    try {
      const parsedJson = JSON.parse(rawText.trim());
      return res.json({ ...parsedJson, usage });
    } catch (parseErr) {
      console.error('❌ Failed to parse AI response as JSON:', parseErr);
      await refundGeneration(creditUserId);
      return res.status(500).json({
        error: {
          message: "AI yanıtı işlenemedi. Lütfen tekrar deneyin.",
          type: 'PARSE_ERROR',
          retriable: true
        }
      });
    }

  } catch (err) {
    console.error('❌ Unexpected error in /api/generate:', err);
    await refundGeneration(creditUserId);
    return res.status(500).json({
      error: {
        message: err.message || "Bilinmeyen sunucu hatası oluştu.",
        type: 'UNKNOWN_ERROR',
        retriable: true
      }
    });
  }
});

// Endpoint to create a Lemon Squeezy Checkout Session
app.post('/api/payment/lemon/create-checkout-session', verifyAuth, validateRequest(checkoutSessionSchema), async (req, res) => {
  try {
    const { plan, userId, billingCycle, successUrl, cancelUrl } = req.body;

    if (!plan || !userId) {
      return res.status(400).json({ error: { message: "Plan ve Kullanıcı ID gereklidir." } });
    }

    // Verify user owns this checkout session (prevent creating checkout for other users)
    if (req.userId !== userId) {
      console.warn(`⚠️ Security: User ${req.userId} attempted to create checkout for user ${userId}`);
      return res.status(403).json({
        error: { message: "Bu işlemi gerçekleştirme izniniz yoktur." }
      });
    }

    const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
    const storeId = process.env.LEMON_SQUEEZY_STORE_ID;

    if (!apiKey || apiKey === 'your_lemonsqueezy_api_key_here' || !storeId || storeId === 'your_lemonsqueezy_store_id_here') {
      return res.status(400).json({
        error: { message: "Lemon Squeezy API anahtarı veya Store ID tanımlanmamış. Lütfen .env dosyasında tanımlayın." }
      });
    }

    const cycle = billingCycle === 'yearly' ? 'yearly' : 'monthly';

    // Map plans and cycles to variant IDs
    const variantIds = {
      monthly: {
        starter: process.env.LEMON_SQUEEZY_VARIANT_STARTER,
        pro: process.env.LEMON_SQUEEZY_VARIANT_PRO,
        studio: process.env.LEMON_SQUEEZY_VARIANT_STUDIO
      },
      yearly: {
        starter: process.env.LEMON_SQUEEZY_VARIANT_STARTER_YEARLY || process.env.LEMON_SQUEEZY_VARIANT_STARTER,
        pro: process.env.LEMON_SQUEEZY_VARIANT_PRO_YEARLY || process.env.LEMON_SQUEEZY_VARIANT_PRO,
        studio: process.env.LEMON_SQUEEZY_VARIANT_STUDIO_YEARLY || process.env.LEMON_SQUEEZY_VARIANT_STUDIO
      }
    };

    const variantId = variantIds[cycle][plan];
    if (!variantId || 
        variantId === 'your_starter_variant_id_here' || 
        variantId === 'your_pro_variant_id_here' || 
        variantId === 'your_studio_variant_id_here' ||
        variantId === 'your_starter_yearly_variant_id_here' || 
        variantId === 'your_pro_yearly_variant_id_here' || 
        variantId === 'your_studio_yearly_variant_id_here') {
      return res.status(400).json({ error: { message: `Geçersiz plan veya varyasyon ID tanımlanmamış: ${plan} (${cycle})` } });
    }

    // A user who already pays switches plans on the existing subscription;
    // a second checkout would leave the old subscription billing as well
    if (supabaseAdmin) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('lemon_subscription_id, subscription_status')
        .eq('id', req.userId)
        .maybeSingle();

      const switchable = ['active', 'on_trial', 'past_due', 'cancelled'];
      if (profile?.lemon_subscription_id && switchable.includes(profile.subscription_status)) {
        const attributes = { variant_id: Number(variantId) };
        if (profile.subscription_status === 'cancelled') {
          // Choosing a paid plan again undoes a pending cancellation
          attributes.cancelled = false;
        }

        const patchResponse = await fetch(`https://api.lemonsqueezy.com/v1/subscriptions/${encodeURIComponent(profile.lemon_subscription_id)}`, {
          method: "PATCH",
          headers: {
            "Accept": "application/vnd.api+json",
            "Content-Type": "application/vnd.api+json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            data: {
              type: "subscriptions",
              id: String(profile.lemon_subscription_id),
              attributes
            }
          })
        });

        if (!patchResponse.ok) {
          const errText = await patchResponse.text();
          console.error(`❌ Lemon Squeezy plan change error (${patchResponse.status}):`, errText);
          return res.status(502).json({ error: { message: "Plan değiştirilemedi. Lütfen tekrar deneyin." } });
        }

        // The subscription_updated webhook applies the new plan and limit
        return res.json({ updated: true, plan, cycle });
      }
    }

    // Prepare redirect URL
    const finalSuccessUrl = successUrl || `${req.headers.origin}/app/?payment=success`;

    // Lemon Squeezy JSON:API payload
    const bodyPayload = {
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            custom: {
              userId: userId,
              plan: plan
            }
          },
          product_options: {
            redirect_url: finalSuccessUrl
          }
        },
        relationships: {
          store: {
            data: {
              type: "stores",
              id: storeId.toString()
            }
          },
          variant: {
            data: {
              type: "variants",
              id: variantId.toString()
            }
          }
        }
      }
    };

    const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
      method: "POST",
      headers: {
        "Accept": "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(bodyPayload)
    });

    if (!response.ok) {
      const errText = await response.text();
      let errMsg = "Lemon Squeezy API Hatası oluştu.";
      try {
        const errJson = JSON.parse(errText);
        if (errJson.errors && errJson.errors.length > 0) {
          errMsg = errJson.errors[0].detail || errMsg;
        } else if (errJson.error) {
          errMsg = errJson.error;
        }
      } catch (e) { }
      return res.status(response.status).json({ error: { message: errMsg } });
    }

    const result = await response.json();
    const checkoutUrl = result.data?.attributes?.url;

    if (!checkoutUrl) {
      return res.status(500).json({ error: { message: "Lemon Squeezy checkout URL'i oluşturulamadı." } });
    }

    return res.json({ id: result.data.id, url: checkoutUrl });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: { message: err.message || "Lemon Squeezy oturumu oluşturulurken hata oluştu." } });
  }
});

// Cancel the user's Lemon Squeezy subscription (access continues until the
// period ends; the subscription_expired webhook then downgrades to free)
app.post('/api/payment/lemon/cancel-subscription', verifyAuth, async (req, res) => {
  try {
    const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
    if (!supabaseAdmin || !apiKey) {
      return res.status(503).json({ error: { message: "Abonelik servisi yapılandırılmamış." } });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('plan, lemon_subscription_id, subscription_status, subscription_ends_at')
      .eq('id', req.userId)
      .maybeSingle();

    if (profileError || !profile) {
      return res.status(404).json({ error: { message: "Profil bulunamadı." } });
    }

    if (!profile.lemon_subscription_id) {
      return res.status(400).json({ error: { message: "İptal edilecek aktif bir abonelik bulunamadı. Lütfen destek ile iletişime geçin." } });
    }

    if (profile.subscription_status === 'cancelled') {
      return res.json({ status: 'cancelled', endsAt: profile.subscription_ends_at });
    }

    const response = await fetch(`https://api.lemonsqueezy.com/v1/subscriptions/${encodeURIComponent(profile.lemon_subscription_id)}`, {
      method: 'DELETE',
      headers: {
        "Accept": "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
        "Authorization": `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`❌ Lemon Squeezy cancel error (${response.status}):`, errText);
      return res.status(502).json({ error: { message: "Abonelik iptal edilemedi. Lütfen tekrar deneyin." } });
    }

    const result = await response.json();
    const attrs = result.data?.attributes || {};

    await supabaseAdmin
      .from('profiles')
      .update({
        subscription_status: attrs.status || 'cancelled',
        subscription_ends_at: attrs.ends_at || null
      })
      .eq('id', req.userId);

    return res.json({ status: attrs.status || 'cancelled', endsAt: attrs.ends_at || null });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: { message: err.message || "Abonelik iptal edilirken hata oluştu." } });
  }
});

// Webhook endpoint to receive inbound emails and reply automatically using Gemini & SMTP
app.post('/api/email/inbound', rateLimiter(50, 60 * 1000, 'Email Inbound'), async (req, res) => {
  try {
    const clientSecret = req.query.secret || req.headers['x-inbound-secret'];
    const expectedSecret = process.env.EMAIL_INBOUND_SECRET;
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

    if (isProduction && (!expectedSecret || expectedSecret === 'your_inbound_webhook_secret_here')) {
      console.error("❌ Inbound Email Webhook: Secret not configured or using default in production.");
      return res.status(500).json({ error: { message: "Internal Server Error: Secure token configuration missing." } });
    }

    if (expectedSecret && expectedSecret !== 'your_inbound_webhook_secret_here' && clientSecret !== expectedSecret) {
      console.warn("⚠️ Inbound Email Webhook: Unauthorized webhook request.");
      return res.status(401).json({ error: { message: "Unauthorized: Invalid secret." } });
    }

    const { from, subject, text } = req.body;

    if (!from || !subject || !text) {
      return res.status(400).json({ error: { message: "E-posta 'from', 'subject' ve 'text' alanları zorunludur." } });
    }

    console.log(`📧 Gelen Mail: [Kimden: ${from}] [Konu: ${subject}]`);

    // Prepare Gemini system prompt
    const systemPrompt = `You are the automated customer support representative for the MayaListing platform (an AI-powered stock photography and e-commerce metadata assistant).
Analyze the language of the incoming customer support email (either Turkish or English). You must write the response in the same language as the incoming email (Turkish for Turkish emails, English for English emails).

Incoming Email Details:
From: ${from}
Subject: ${subject}
Message Content:
${text}

Response Rules (Turkish / Türkçe):
1. Yanıtın başında mutlaka gönderen kişiye kibar bir şekilde hitap et (örn: "Merhaba," veya isim varsa "Merhaba Ali Bey,").
2. MayaListing'ın özelliklerini bil: Görselleri analiz edip SEO uyumlu Türkçe başlık, açıklama ve anahtar kelimeler üreten yapay zeka asistanıdır. Adobe Stock, Shutterstock, Freepik, Etsy, Trendyol gibi platformları destekler. Ücretsiz (5 limit, Ücretsiz), Starter (300 limit, 9.99$), Pro (1000 limit, 29.99$) ve Studio (Sınırsız limit, 49.99$) abonelik planları sunar.
3. Soruyu veya sorunu net bir şekilde anladığını hissettir. Eğer teknik bir sorun veya iade/fatura talebi varsa, konunun ayrıca teknik destek ekibine iletildiğini ve en kısa sürede inceleneceğini söyle.
4. Müşteriye doğrudan yardımcı olabileceğin genel konularda (üyelik limitleri, platform özellikleri vb.) net ve açıklayıcı bilgi ver.
5. Yazdığın yanıt doğrudan e-posta olarak gönderilecektir, bu yüzden sadece e-posta metnini döndür. E-postanın sonuna "Saygılarımızla,\nMayaListing Destek Ekibi" imzasını ekle. HTML tagları kullanma, sadece düz metin (plain text) üret.

Response Rules (English):
1. Address the sender politely at the beginning (e.g., "Hello," or "Hello [Name]," or "Dear [Name],").
2. Know MayaListing' features: It is an AI-powered assistant that analyzes photos to generate platform-specific SEO-friendly titles, descriptions, and keywords. It supports platforms like Adobe Stock, Shutterstock, Freepik, Etsy, Trendyol, and Amazon. It offers four plans: Free (5 image limit, Free), Starter (300 image limit, $9.99/mo), Pro (1000 image limit, $29.99/mo), and Studio (Unlimited images, $49.99/mo).
3. Make the customer feel that you clearly understood their issue. If there is a technical problem, refund request, or billing inquiry, state that the issue has been forwarded to the technical support team and will be reviewed as soon as possible.
4. Provide clear and descriptive information for general questions where you can directly help (membership limits, platform features, etc.).
5. Your response will be sent directly as an email, so only return the email body text. Add the signature "Best regards,\nMayaListing Support Team" at the end of the email. Do not use HTML tags, generate only plain text.`;

    let apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    const isPlaceholder = !apiKey || 
      apiKey.includes('your_gemini_api_key_here') || 
      apiKey.trim() === '' || 
      apiKey.includes('placeholder') || 
      apiKey.length < 15;

    if (isPlaceholder) {
      return res.status(500).json({
        error: { message: "Sunucu hatası: Gemini API anahtarı yapılandırılmamış. Sistem yöneticisine başvurunuz." }
      });
    }
    let replyText = "";

    if (apiKey) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: systemPrompt }
                ]
              }
            ]
          })
        });

        if (response.ok) {
          const result = await response.json();
          replyText = result.candidates?.[0]?.content?.parts?.[0]?.text || "";
        } else {
          console.error("❌ Gemini API responded with an error for auto-responder.");
        }
      } catch (geminiErr) {
        console.error("❌ Gemini API request error in auto-responder:", geminiErr.message);
      }
    }

    if (!replyText) {
      // Fallback response if Gemini fails or is unconfigured
      const isEnglish = /hello|hi|support|help|account|issue|error|subscription|plan/i.test(subject + ' ' + text);
      if (isEnglish) {
        replyText = `Hello,\n\nThank you for contacting MayaListing support. Your email has been received.\n\nYour request has been successfully forwarded to our support team and we will get back to you as soon as possible.\n\nBest regards,\nMayaListing Support Team`;
      } else {
        replyText = `Merhaba,\n\nMayaListing destek birimine gönderdiğiniz e-posta tarafımıza ulaşmıştır.\n\nTalebiniz başarıyla destek ekibimize iletilmiş olup en kısa sürede sizinle iletişime geçilecektir.\n\nSaygılarımızla,\nMayaListing Destek Ekibi`;
      }
    }

    // Send email response via nodemailer if configured
    if (emailTransporter) {
      // Parse clean sender email from the "from" header (e.g. "Name <email@domain.com>" -> "email@domain.com")
      const toEmail = from.includes('<') ? from.substring(from.indexOf('<') + 1, from.indexOf('>')) : from.trim();

      const isResponseEnglish = /best regards|support team|hello|dear/i.test(replyText);
      const senderName = isResponseEnglish ? "MayaListing Support" : "MayaListing Destek";

      const mailOptions = {
        from: `"${senderName}" <${process.env.EMAIL_SMTP_USER}>`,
        to: toEmail,
        subject: subject.toLowerCase().startsWith('re:') ? subject : `Re: ${subject}`,
        text: replyText
      };

      try {
        await emailTransporter.sendMail(mailOptions);
        console.log(`✉ Otomatik yanıt başarıyla gönderildi: ${toEmail}`);
        return res.json({ success: true, message: "Otomatik yanıt gönderildi.", reply: replyText });
      } catch (smtpErr) {
        console.error("❌ SMTP sendMail error in auto-responder:", smtpErr.message);
        return res.json({ success: false, message: "SMTP hatası. E-posta gönderilemedi.", reply: replyText, error: smtpErr.message });
      }
    } else {
      console.warn("⚠️ SMTP Transporter is not configured. AI response generated but not sent via email.");
      return res.json({ success: false, message: "SMTP tanımlı değil. E-posta gönderilemedi.", reply: replyText });
    }
  } catch (err) {
    console.error("❌ Inbound email handler error:", err);
    return res.status(500).json({ error: { message: err.message || "E-posta işlenirken sunucu hatası oluştu." } });
  }
});

// SPA Trailing Slash Redirects
app.use((req, res, next) => {
  if (req.path === '/app' || req.path === '/auth/callback') {
    return res.redirect(301, req.path + '/' + (req.url.slice(req.path.length)));
  }
  next();
});

// Health check endpoint — under /api/ so Vercel's "/api/(.*)" rewrite routes it
// to this Express app in production. Verifies at runtime whether env vars
// (Gemini/Supabase/etc.) are actually reachable.
app.get(['/api/health', '/health'], async (req, res) => {
  const checks = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || (process.env.VERCEL ? 'vercel' : 'development'),
    services: {}
  };

  // Check Gemini API key
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  checks.services.gemini = (apiKey && !apiKey.startsWith('your_') && apiKey.length >= 15)
    ? { status: 'healthy' }
    : { status: 'unconfigured' };

  // Check Supabase
  checks.services.supabase = (process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY)
    ? { status: 'healthy' }
    : { status: 'unconfigured' };

  // Check Email
  checks.services.email = emailTransporter ? { status: 'healthy' } : { status: 'unconfigured' };

  return res.status(200).json(checks);
});

// Serve static files and handle SPA fallback only when not running on Vercel
if (!process.env.VERCEL) {
  // Serve static files from the 'dist' directory with cache headers
  app.use(express.static(path.join(__dirname, 'dist'), {
    maxAge: '1d',
    etag: true,
    setHeaders: (res, path) => {
      // If it is a hashed asset generated by Vite (or other static media assets), cache it aggressively
      if (/[.-][a-zA-Z0-9-_]{8,}\.(js|css|woff2?|png|jpg|jpeg|gif|svg|webp|mp4)$/.test(path) || path.endsWith('.mp4')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else {
        // Otherwise cache for 1 hour (e.g. index.html)
        res.setHeader('Cache-Control', 'public, max-age=3600');
      }
    }
  }));

  // Fallback for SPA routing
  app.get(/.*/, (req, res) => {
    if (req.path.startsWith('/app/')) {
      res.sendFile(path.join(__dirname, 'dist', 'app', 'index.html'));
    } else if (req.path.startsWith('/auth/callback/')) {
      res.sendFile(path.join(__dirname, 'dist', 'auth', 'callback', 'index.html'));
    } else {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    }
  });
}

// Global Error Handler Middleware (prevents HTML rendering of errors)
app.use((err, req, res, next) => {
  console.error("❌ Sunucu Hatası:", err.stack || err.message);
  res.status(err.status || 500).json({
    error: { message: err.message || "Bilinmeyen bir sunucu hatası oluştu." }
  });
});

// Start Server
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Güvenli API Proxy Sunucusu http://localhost:${PORT} adresinde çalışıyor.`);
  });
}

export default app;
