# MayaListing — Yapay Zeka Destekli Stok Fotoğraf ve E-Ticaret Metadata Aracı 📷✨

MayaListing, görselleri Google Gemini ile analiz edip stok fotoğraf siteleri ve e-ticaret pazaryerleri için başlık, açıklama ve anahtar kelime üretir. Canlı adres: https://www.mayalisting.com

---

## Özellikler

- **Yapay zeka analizi:** Ücretsiz ve Starter planlarda Gemini Flash, Pro ve Studio'da Gemini Pro (model adları ortam değişkeniyle değiştirilebilir).
- **Platforma özel çıktı:** Adobe Stock, Shutterstock, Freepik ve Vecteezy için her zaman İngilizce; e-ticaret (Etsy, Trendyol, Amazon, Shopify…) için seçilen dilde.
- **Toplu analiz:** Birden çok görsel seçilir, sırayla analiz edilip geçmişe kaydedilir (sekme açık kalmalı).
- **Dışa aktarma:** Orijinal dosya adlarıyla Adobe Stock, Shutterstock, Freepik, Vecteezy CSV'leri ve genel bir e-ticaret CSV'si.
- **Metadata'lı JPG indirme:** Başlık, açıklama ve anahtar kelimeler XMP olarak orijinal JPEG'e yazılır.
- **Hesap:** Geçmişten tek analiz silme, hesabı ve tüm verileri silme (KVKK), yıllık/aylık plan, abonelik iptali.
- **Ücretsiz araç:** Kayıtsız metadata kontrol aracı (`/araclar/metadata-kontrol/`, `/en/tools/metadata-checker/`).
- **TR/EN arayüz**, açık/koyu tema, çerez onayı (Google Consent Mode v2).

## Mimari

| Katman | Teknoloji |
| --- | --- |
| Ön yüz | Vanilla JS + Vite 8 (çok sayfalı), i18next |
| Sunucu | Node.js 22, Express (`server.js`), Vercel serverless (`api/index.js`) |
| Veritabanı, giriş, depolama | Supabase (Postgres + RLS, Auth, özel `images` deposu) |
| Yapay zeka | Google Gemini API (sunucu tarafında, anahtar istemciye gitmez) |
| Ödeme | Lemon Squeezy (Merchant of Record) + webhook'lar |

Kredi ve kötüye kullanım sınırları veritabanında tutulur (`public.app_limits`, `consume_generation`): aylık kota, plan başına günlük sınır, ücretsiz planda IP başına günlük sınır ve tüm sistem için günlük tavan. Sınırlar deploy gerektirmeden SQL ile değiştirilebilir.

## Kurulum

```bash
npm install
cp .env.example .env   # değerleri doldurun
npm run dev            # Vite (3000) + Express (3001)
```

Veritabanı: Supabase SQL Editor'de önce `supabase_schema.sql`, ardından `supabase/migrations/` altındaki dosyaları tarih sırasıyla çalıştırın.

### Ortam değişkenleri

| Değişken | Nerede | Not |
| --- | --- | --- |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | ön yüz + sunucu | Herkese açık anahtarlar |
| `SUPABASE_SERVICE_ROLE_KEY` | yalnız sunucu | Kredi kontrolü, webhook'lar, silme işlemleri için zorunlu |
| `GEMINI_API_KEY` | yalnız sunucu | `VITE_` öneki kullanmayın; eski `VITE_GEMINI_API_KEY` adı da okunur |
| `GEMINI_MODEL_FAST`, `GEMINI_MODEL_PRO` | yalnız sunucu | İsteğe bağlı model değişimi |
| `LEMON_SQUEEZY_*` | yalnız sunucu | API anahtarı, mağaza, webhook secret, plan varyantları |
| `EMAIL_SMTP_*`, `EMAIL_INBOUND_SECRET` | yalnız sunucu | Destek e-postası otomatik yanıtı |

## Komutlar

```bash
npm test          # Vitest (birim testler)
npm run build     # yasal sayfaları üretir + Vite build
npm start         # dist/ klasörünü Express ile sunar
```

## İzleme ve CI

- `.github/workflows/ci.yml`: her push'ta test, build ve bağımlılık denetimi.
- `.github/workflows/monitor.yml`: saatlik `/api/health?deep=1` kontrolü; sorun varsa GitHub'da "monitor" issue'su açar.
- Kullanım ve tahmini maliyet: Supabase'de `admin_usage_daily`, `admin_usage_today`, `admin_top_users_today` görünümleri.

## Lisans

[MIT](LICENSE) — katkı için [CONTRIBUTING.md](CONTRIBUTING.md).
