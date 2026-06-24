import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';
import crypto from 'crypto';
import nodemailer from 'nodemailer';



// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Stripe
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
}

// Initialize Supabase Admin Client
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabaseAdmin = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  },
  realtime: {
    transport: WebSocket
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

  // Verify SMTP connection config on boot
  emailTransporter.verify((error, success) => {
    if (error) {
      console.error('❌ SMTP Connection verification failed:', error.message);
    } else {
      console.log('📧 SMTP Server is ready to send email replies.');
    }
  });
} else {
  console.warn('⚠️ SMTP Configuration is missing or using placeholder values. AI email auto-responder is disabled.');
}

// Middlewares
app.use(cors());

// Stripe Webhook Endpoint (needs raw body parser, must be defined before express.json)
app.post('/api/payment/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    if (stripe && endpointSecret && sig) {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } else {
      // Development bypass fallback if signing secret is missing or stripe is uninitialized
      console.warn("⚠️ Stripe Webhook signature verification bypassed. Check STRIPE_WEBHOOK_SECRET in production.");
      const rawBody = req.body.toString('utf8');
      event = JSON.parse(rawBody);
    }
  } catch (err) {
    console.error(`❌ Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata?.userId;
    const plan = session.metadata?.plan;
    const limit = parseInt(session.metadata?.limit || '100', 10);

    if (userId && plan) {
      console.log(`✅ Webhook: Payment successful for User: ${userId}, Plan: ${plan}, Limit: ${limit}`);

      if (supabaseAdmin) {
        const { error } = await supabaseAdmin
          .from('profiles')
          .update({
            plan: plan,
            generations_limit: limit
          })
          .eq('id', userId);

        if (error) {
          console.error(`❌ Supabase update error: ${error.message}`);
        } else {
          console.log(`🎉 User ${userId} successfully upgraded to ${plan.toUpperCase()} plan.`);
        }
      } else {
        console.warn("⚠️ Supabase admin client not initialized. Cannot update user profile.");
      }
    }
  }

  res.json({ received: true });
});

// Lemon Squeezy Webhook Endpoint (needs raw body parser, must be defined before express.json)
app.post('/api/payment/lemon/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
  const signature = req.headers['x-signature'];

  if (!signature) {
    console.error('❌ Lemon Squeezy Webhook: Missing x-signature header');
    return res.status(400).send('Webhook Error: Missing x-signature header');
  }

  const rawBody = req.body;

  try {
    if (secret) {
      const hmac = crypto.createHmac('sha256', secret);
      const digest = hmac.update(rawBody).digest('hex');
      if (digest !== signature) {
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
  const customData = event.meta?.custom_data;

  console.log(`🔔 Lemon Squeezy Webhook received: ${eventName}`);

  // Handle subscription_created / order_created
  if (eventName === 'order_created' || eventName === 'subscription_created') {
    const userId = customData?.userId || customData?.user_id;
    const plan = customData?.plan;

    const planLimits = {
      starter: 100,
      pro: 1000,
      studio: 999999
    };

    const limit = planLimits[plan] || 100;

    if (userId && plan) {
      console.log(`✅ Lemon Squeezy Webhook: Payment successful for User: ${userId}, Plan: ${plan}, Limit: ${limit}`);

      if (supabaseAdmin) {
        const { error } = await supabaseAdmin
          .from('profiles')
          .update({
            plan: plan,
            generations_limit: limit
          })
          .eq('id', userId);

        if (error) {
          console.error(`❌ Supabase update error: ${error.message}`);
        } else {
          console.log(`🎉 User ${userId} successfully upgraded to ${plan.toUpperCase()} plan via Lemon Squeezy.`);
        }
      } else {
        console.warn("⚠️ Supabase admin client not initialized. Cannot update user profile.");
      }
    } else {
      console.warn("⚠️ Lemon Squeezy Webhook: Missing custom metadata userId or plan", customData);
    }
  }

  res.json({ received: true });
});

// Gemini prompts can be large, increase payload size limit to 20MB for high-res base64 images
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

// Endpoint for metadata generation
app.post('/api/generate', async (req, res) => {
  try {
    const { base64DataUrl, categoryKey, customApiKey } = req.body;
    
    if (!base64DataUrl) {
      return res.status(400).json({ error: { message: "Görsel verisi bulunamadı." } });
    }

    const apiKey = customApiKey || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ 
        error: { message: "Gemini API Anahtarı bulunamadı. Lütfen sunucuda tanımlayın veya hesap bilgilerinizden ekleyin." } 
      });
    }

    // 1. Get Category Name
    const cats = {
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
    const categoryName = cats[categoryKey] || 'Genel';

    // 2. Parse base64DataUrl
    const regex = /^data:(image\/[a-zA-Z+.-]+);base64,(.+)$/;
    const matches = base64DataUrl.match(regex);
    if (!matches) {
      return res.status(400).json({ error: { message: "Geçersiz resim formatı." } });
    }
    const mimeType = matches[1];
    const base64Data = matches[2];

    // 3. Prompt Construction
    const prompt = `Görseli detaylı bir şekilde analiz et ve aşağıdaki JSON yapısına uygun olarak Türkçe stok fotoğraf metadata ve e-ticaret bilgilerini üret.
Görsel Kategorisi: ${categoryName}

JSON Yapısı ve Kurallar:
{
  "category": "${categoryKey}",
  "title": "Görselin içeriğini en iyi yansıtan, SEO uyumlu, profesyonel Türkçe stok başlığı (maksimum 70 karakter).",
  "description": "Görselin kompozisyonunu, renklerini, nesnelerini ve atmosferini açıklayan 2-3 cümlelik detaylı Türkçe açıklama.",
  "keywords": "Görselle en alakalı 30 adet Türkçe anahtar kelime (etiket), aralarında virgül ve boşluk olacak şekilde tek bir satırda yazılmalıdır (örn: kupa, seramik, kahve fincanı...). Tamamı küçük harf olmalıdır.",
  "tags": "E-Ticaret için optimize edilmiş, en fazla 20 karakter uzunluğunda 13 adet ürün etiketi, aralarında virgül ve boşluk olacak şekilde tek bir satırda yazılmalıdır. Tamamı küçük harf olmalıdır.",
  
  "adobe": {
    "title": "Stok başlığı ile aynı veya çok benzer bir başlık.",
    "keywords": "Yukarıdaki keywords listesinden seçilen en alakalı 30 anahtar kelime, aralarında virgülle ayrılmış şekilde."
  },
  
  "shutterstock": {
    "title": "Başlığın sonuna ' - Stok Fotoğrafı' eklenmiş hali.",
    "keywords": "Keywords listesinden seçilen ve genişletilen en fazla 50 anahtar kelime, aralarında virgülle ayrılmış şekilde."
  },
  
  "freepik": {
    "title": "Başlığın tamamen küçük harflerle yazılmış hali.",
    "keywords": "Keywords listesinden seçilen en fazla 25 anahtar kelime, tamamen küçük harflerle yazılmış ve aralarında virgülle ayrılmış şekilde."
  },
  
  "vecteezy": {
    "title": "Stok başlığı ile aynı.",
    "description": "Stok açıklaması ile aynı.",
    "keywords": "Keywords listesinden seçilen en fazla 20 anahtar kelime, aralarında virgülle ayrılmış şekilde."
  },
  
  "ecommerce": {
    "title": "E-ticaret siteleri (Etsy, Trendyol vs.) için optimize edilmiş, anahtar kelimeler içeren boru işareti (|) ile ayrılmış zengin başlık (örn: 'El Yapımı Seramik Kahve Kupası | Özel Tasarım Kupa Bardak | Hediye Kupa Bardak - Minimalist İskandinav Serisi').",
    "description": "Premium e-ticaret ürün açıklaması. Emojilerle süslenmiş, maddeler halinde özellikler, kullanım alanları ve hediye tavsiyeleri içermelidir.",
    "tags": "Etsy/Trendyol uyumlu, aralarında virgülle ayrılmış tam olarak 13 adet küçük harfli etiket."
  }
}

ÇIKTI SADECE YUKARIDAKİ JSON ŞABLONUNA UYGUN BİR JSON OLMALIDIR. Başka açıklama veya kod bloğu içermemelidir.`;

    // 4. API Request using Node 20 global fetch
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
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
      const errText = await response.text();
      let errMsg = "API Hatası oluştu.";
      try {
        const errJson = JSON.parse(errText);
        errMsg = errJson.error?.message || errMsg;
      } catch (e) {}
      return res.status(response.status).json({ error: { message: errMsg } });
    }

    const result = await response.json();
    const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      return res.status(500).json({ error: { message: "API boş yanıt döndürdü." } });
    }

    const parsedJson = JSON.parse(rawText.trim());
    return res.json(parsedJson);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: { message: err.message || "Bilinmeyen sunucu hatası." } });
  }
});

// Endpoint to create a Stripe Checkout Session
app.post('/api/payment/create-checkout-session', async (req, res) => {
  try {
    const { plan, userId, successUrl, cancelUrl } = req.body;

    if (!plan || !userId) {
      return res.status(400).json({ error: { message: "Plan ve Kullanıcı ID gereklidir." } });
    }

    if (!stripe) {
      return res.status(400).json({ 
        error: { message: "Stripe API anahtarı tanımlanmamış. Lütfen .env dosyasında STRIPE_SECRET_KEY tanımlayın." } 
      });
    }

    const planDetails = {
      starter: { name: 'Starter Planı', price: 999, currency: 'usd', limit: 100 },
      pro: { name: 'Pro Planı', price: 2999, currency: 'usd', limit: 1000 },
      studio: { name: 'Studio Planı', price: 4999, currency: 'usd', limit: 999999 }
    };

    const details = planDetails[plan];
    if (!details) {
      return res.status(400).json({ error: { message: "Geçersiz plan seçildi." } });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: details.currency,
            product_data: {
              name: details.name,
              description: `Aylık ${details.limit === 999999 ? 'Sınırsız' : details.limit} Görsel Analiz`,
            },
            unit_amount: details.price,
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl || `${req.headers.origin}/app/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${req.headers.origin}/app/?payment=cancel`,
      metadata: {
        userId: userId,
        plan: plan,
        limit: details.limit.toString()
      }
    });

    return res.json({ id: session.id, url: session.url });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: { message: err.message || "Stripe oturumu oluşturulurken hata oluştu." } });
  }
});

// Endpoint to create a Lemon Squeezy Checkout Session
app.post('/api/payment/lemon/create-checkout-session', async (req, res) => {
  try {
    const { plan, userId, successUrl, cancelUrl } = req.body;

    if (!plan || !userId) {
      return res.status(400).json({ error: { message: "Plan ve Kullanıcı ID gereklidir." } });
    }

    const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
    const storeId = process.env.LEMON_SQUEEZY_STORE_ID;
    
    if (!apiKey || apiKey === 'your_lemonsqueezy_api_key_here' || !storeId || storeId === 'your_lemonsqueezy_store_id_here') {
      return res.status(400).json({ 
        error: { message: "Lemon Squeezy API anahtarı veya Store ID tanımlanmamış. Lütfen .env dosyasında tanımlayın." } 
      });
    }

    // Map plans to variant IDs
    const variantIds = {
      starter: process.env.LEMON_SQUEEZY_VARIANT_STARTER,
      pro: process.env.LEMON_SQUEEZY_VARIANT_PRO,
      studio: process.env.LEMON_SQUEEZY_VARIANT_STUDIO
    };

    const variantId = variantIds[plan];
    if (!variantId || variantId === 'your_starter_variant_id_here' || variantId === 'your_pro_variant_id_here' || variantId === 'your_studio_variant_id_here') {
      return res.status(400).json({ error: { message: `Geçersiz plan veya varyasyon ID tanımlanmamış: ${plan}` } });
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
      } catch (e) {}
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

// Webhook endpoint to receive inbound emails and reply automatically using Gemini & SMTP
app.post('/api/email/inbound', async (req, res) => {
  try {
    const clientSecret = req.query.secret || req.headers['x-inbound-secret'];
    const expectedSecret = process.env.EMAIL_INBOUND_SECRET;

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
    const systemPrompt = `Sen MayaSolutions Yapay Zeka Destekli Stok Fotoğraf Asistanı platformunun otomatik müşteri temsilcisisin.
Gelen müşteri destek e-postasına profesyonel, yardımsever, çözüm odaklı ve kibar bir dille Türkçe yanıt yazmalısın.

Gelen Mail Bilgileri:
Gönderen: ${from}
Konu: ${subject}
Mesaj İçeriği:
${text}

Yanıt Kuralları:
1. Yanıtın başında mutlaka gönderen kişiye kibar bir şekilde hitap et (örn: "Merhaba," veya isim varsa "Merhaba Ali Bey,").
2. MayaSolutions'ın özelliklerini bil: Görselleri analiz edip SEO uyumlu Türkçe başlık, açıklama ve anahtar kelimeler üreten yapay zeka asistanıdır. Adobe Stock, Shutterstock, Freepik, Etsy, Trendyol gibi platformları destekler. Starter (100 limit, 9.99$), Pro (1000 limit, 29.99$) ve Studio (Sınırsız limit, 49.99$) abonelik planları sunar.
3. Soruyu veya sorunu net bir şekilde anladığını hissettir. Eğer teknik bir sorun veya iade/fatura talebi varsa, konunun ayrıca teknik destek ekibine iletildiğini ve en kısa sürede inceleneceğini söyle.
4. Müşteriye doğrudan yardımcı olabileceğin genel konularda (üyelik limitleri, platform özellikleri vb.) net ve açıklayıcı bilgi ver.
5. Yazdığın yanıt doğrudan e-posta olarak gönderilecektir, bu yüzden sadece e-posta metnini döndür. E-postanın sonuna "Saygılarımızla,\nMayaSolutions Destek Ekibi" imzasını ekle. HTML tagları kullanma, sadece düz metin (plain text) üret.`;

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
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
      replyText = `Merhaba,\n\nMayaSolutions destek birimine gönderdiğiniz e-posta tarafımıza ulaşmıştır.\n\nTalebiniz başarıyla destek ekibimize iletilmiş olup en kısa sürede sizinle iletişime geçilecektir.\n\nSaygılarımızla,\nMayaSolutions Destek Ekibi`;
    }

    // Send email response via nodemailer if configured
    if (emailTransporter) {
      // Parse clean sender email from the "from" header (e.g. "Name <email@domain.com>" -> "email@domain.com")
      const toEmail = from.includes('<') ? from.substring(from.indexOf('<') + 1, from.indexOf('>')) : from.trim();
      
      const mailOptions = {
        from: `"MayaSolutions Destek" <${process.env.EMAIL_SMTP_USER}>`,
        to: toEmail,
        subject: subject.toLowerCase().startsWith('re:') ? subject : `Re: ${subject}`,
        text: replyText
      };

      await emailTransporter.sendMail(mailOptions);
      console.log(`✉ Otomatik yanıt başarıyla gönderildi: ${toEmail}`);
      return res.json({ success: true, message: "Otomatik yanıt gönderildi.", reply: replyText });
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

// Serve static files from the 'dist' directory
app.use(express.static(path.join(__dirname, 'dist')));

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

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Güvenli API Proxy Sunucusu http://localhost:${PORT} adresinde çalışıyor.`);
});
