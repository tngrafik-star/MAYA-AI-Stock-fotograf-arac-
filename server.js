import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
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
