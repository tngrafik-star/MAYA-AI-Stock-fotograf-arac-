# Katkıda Bulunma Rehberi (Contributing Guide)

MayaListing projesine katkıda bulunmak istediğiniz için teşekkür ederiz! 🎉 Her türlü katkıyı (hata bildirimleri, özellik önerileri, dokümantasyon düzeltmeleri veya kod katkıları) memnuniyetle kabul ediyoruz.

Aşağıdaki rehber, projeye hızlı ve düzenli bir şekilde katkıda bulunmanıza yardımcı olacaktır.

---

## 🛠️ Başlangıç

Katkıda bulunmadan önce lütfen aşağıdaki adımları tamamladığınızdan emin olun:

1. Projeyi kendi GitHub hesabınıza **Fork** edin.
2. Fork ettiğiniz depoyu (repository) yerel makinenize clone edin:
   ```bash
   git clone https://github.com/KULLANICI_ADINIZ/MAYA-AI-Stock-fotograf-araci.git
   ```
3. [README.md](file:///Users/alicoban/Desktop/MAYA%20AI%20Stock%20fotograf%20aracı/README.md) dosyasındaki **Kurulum ve Yapılandırma** adımlarını takip ederek yerel geliştirme ortamınızı kurun ve projenin çalıştığından emin olun.

---

## 🐛 Hata Bildirimleri (Bug Reports)

Bir hata bulduysanız veya beklenmeyen bir davranışla karşılaştıysanız lütfen GitHub Issues üzerinden bir hata bildirimi oluşturun. Bildiriminizde şunlara yer vermeye özen gösterin:

- Hatanın kısa ve açıklayıcı bir özeti.
- Hatayı yeniden üretmek (reproduce) için adım adım talimatlar.
- Beklenen davranış ve gerçekleşen davranış.
- Ekran görüntüleri veya hata logları (varsa).
- Tarayıcı ve işletim sistemi bilgileri.

---

## 💡 Özellik Önerileri (Feature Requests)

Yeni bir özellik veya iyileştirme fikriniz varsa, bunu tartışmak için yine bir GitHub Issue açabilirsiniz. Önerinizi açıklarken şu noktaları belirtmeniz faydalı olacaktır:

- Önerdiğiniz özelliğin ne olduğu ve ne işe yarayacağı.
- Neden bu özelliğe ihtiyaç duyulduğu (kullanım senaryoları).
- Varsa tasarım veya uygulama fikirleriniz.

---

## 💻 Kod Katkısı ve Pull Request (PR) Süreci

Kod yazarak katkıda bulunmak istiyorsanız lütfen aşağıdaki süreci izleyin:

### 1. Yeni Bir Branch (Dal) Oluşturun
Katkıda bulunacağınız konuyla ilgili anlamlı bir branch adı seçin:
```bash
# Özellik ekleme için:
git checkout -b feature/eklenecek-ozellik

# Hata düzeltme için:
git checkout -b fix/duzeltilecek-hata

# Dokümantasyon için:
git checkout -b docs/guncellenecek-alan
```

### 2. Kodunuzu Geliştirin ve Test Edin
- Projenin kod stilini ve yapısını koruyun.
- Yaptığınız değişikliklerin projeyi bozmadığından emin olmak için yerel olarak `npm run dev` ile test edin.
- Mümkünse, eklediğiniz yeni özellikler için test/doğrulama senaryolarını gerçekleştirin.

### 3. Commit Mesajları
Commit mesajlarınızın net, kısa ve ne yapıldığını açıklar nitelikte olmasına özen gösterin (İngilizce veya Türkçe standartlarında):
*Örnek:* `feat: gemini analizine yeni e-ticaret şablonu eklendi` veya `fix: supabase auth callback hatası düzeltildi`

### 4. Pull Request Gönderin
- Kodunuzu kendi fork'unuza push edin:
  ```bash
  git push origin feature/eklenecek-ozellik
  ```
- Orijinal depoya gidin ve **New Pull Request** butonuna tıklayın.
- PR açıklamasında yaptığınız değişiklikleri, çözülen issue'ları (varsa `#issue_numarasi` şeklinde) ve nasıl test edileceğini detaylıca yazın.
- PR'ınızın güncel `main` branch'i ile çakışmadığından (conflict olmadığından) emin olun.

---

## 📜 Lisans

Bu projeye yaptığınız tüm katkılar [LICENSE](file:///Users/alicoban/Desktop/MAYA%20AI%20Stock%20fotograf%20aracı/LICENSE) dosyası altında belirtilen **MIT Lisansı** ile lisanslanacaktır.
