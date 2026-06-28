# MayaListing - Yapay Zeka Destekli Stok Fotoğraf Asistanı 📷✨

MayaListing, profesyonel fotoğrafçılar, içerik üreticileri ve e-ticaret satıcıları için geliştirilmiş, yapay zeka destekli bir stok fotoğraf ve ürün metadata otomasyon platformudur. Görsellerinizi saniyeler içinde analiz ederek platforma özel başlık, açıklama ve SEO uyumlu etiket (keyword) setleri üretir.

---

## 🚀 Öne Çıkan Özellikler

- 🧠 **Yapay Zeka Analizi:** Görselin kompozisyonunu, objelerini, renklerini ve temasını gelişmiş yapay zeka (`gemini-2.5-flash`) ile çözümler.
- 🛍️ **Çoklu Platform Desteği:** 
  - **Stok Siteleri:** Adobe Stock, Shutterstock, Freepik ve Vecteezy standartlarına tam uyumlu meta veriler.
  - **E-Ticaret Pazaryerleri:** Trendyol, Etsy, Amazon, Hepsiburada ve n11 için optimize edilmiş, zengin başlık ve emojili açıklama şablonları.
- 📦 **Toplu İşlem (Batch Processing):** Birden fazla fotoğrafı aynı anda kuyruğa ekleme ve arka planda analiz etme imkanı.
- 📥 **Gelişmiş Dışa Aktarma:** Analiz edilen görsellerin verilerini stok sitelerinin kabul ettiği formatlarda toplu CSV olarak indirme.
- 🔐 **Güvenli Kimlik Doğrulama & Veritabanı:** Supabase entegrasyonu ile güvenli üyelik sistemi, kullanıcı yönetimi ve geçmiş arşivleme.
- 🌓 **Karanlık/Aydınlık Tema:** Modern, göz yormayan lüks arayüz tasarımı.

---

## 🛠️ Teknolojiler

- **Frontend:** HTML5, Vanilla CSS, JavaScript (Vite derleyicisi ile)
- **Backend:** Node.js, Express.js (Güvenli API Proxy sunucusu)
- **Yapay Zeka:** Google Gemini API (`gemini-2.5-flash` modeli)
- **Veritabanı & Auth:** Supabase (PostgreSQL)

---

## 📂 Proje Yapısı

```text
├── app/                  # Gösterge paneli ve uygulama arayüzü dosyaları
├── auth/                 # Supabase Auth yönlendirme ve callback sayfaları
├── css/                  # Proje genelindeki stil dosyaları (landing.css, global.css vb.)
├── js/                   # Frontend mantıksal JavaScript dosyaları (main.js, supabase.js vb.)
├── public/               # Statik varlıklar (resimler, videolar, logolar)
├── server.js             # Express.js API Proxy sunucusu
├── index.html            # Landing (Giriş) sayfası
├── vite.config.js        # Vite yapılandırma dosyası
└── package.json          # Proje bağımlılıkları ve script tanımları
```

---

## ⚙️ Kurulum ve Yapılandırma

### 1. Gereksinimler
Sisteminizde **Node.js** (v18+) kurulu olmalıdır.

### 2. Bağımlılıkların Yüklenmesi
Proje dizininde terminali açıp aşağıdaki komutu çalıştırın:
```bash
npm install
```

### 3. Çevre Değişkenlerinin Tanımlanması
Projenin kök dizininde `.env` adında bir dosya oluşturun ve `.env.example` içindeki değişkenleri kendi anahtarlarınızla doldurun:

```env
# Gemini API Key (Google AI Studio'dan alınır)
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Supabase Yapılandırması
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

---

## 💻 Çalıştırma Komutları

Projede frontend (Vite) ve backend (Express) sunucularını aynı anda veya ayrı ayrı başlatabilirsiniz:

### Geliştirme Ortamı (Önerilen)
Hem frontend hem de backend sunucusunu tek komutla başlatmak için:
```bash
npm run dev
```
- Sunucu varsayılan olarak **http://localhost:3000** portunda çalışacaktır (Express sunucusu 3001 numaralı portu kullanır).

### Servisleri Ayrı Ayrı Çalıştırma
- **Sadece Frontend:** `npm run dev:frontend`
- **Sadece Backend:** `npm run dev:backend`

### Üretim (Production) Ortamı
1. Arayüzü derleyin (Derlenen dosyalar `dist/` klasörüne aktarılır):
   ```bash
   npm run build
   ```
2. Express sunucusunu başlatın (Vite ile derlenmiş dosyaları statik olarak sunar):
   ```bash
   npm start
   ```

---

## 🔒 Güvenlik Notu

Gemini API anahtarınızın güvenliği için, doğrudan tarayıcı üzerinden istek atılması yerine `server.js` üzerinde çalışan güvenli bir proxy yapısı kurgulanmıştır. İstemci (frontend), görseli backend sunucusundaki `/api/generate` uç noktasına (endpoint) gönderir; sunucu ise kendi `.env` dosyasındaki API anahtarını kullanarak Google Gemini sunucuları ile güvenli bir şekilde haberleşir.

---

## 📄 Lisans ve Katkıda Bulunma

Bu proje **[MIT Lisansı](LICENSE)** ile lisanslanmıştır. Projeye katkıda bulunmak için lütfen **[Katkıda Bulunma Rehberi](CONTRIBUTING.md)**'ni inceleyin.

