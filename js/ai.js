// AI Metadata Simulator for MayaSolutions
// Generates realistic Turkish stock & e-commerce metadata based on category selection

const CATEGORY_TEMPLATES = {
  decor: {
    name: 'Yaşam & Dekorasyon',
    titles: [
      'Minimalist Seramik Kupa ve Doğal Ahşap Altlık',
      'Bohem Tarzı Toprak Saksıda Kuru Çiçek Aranjmanı',
      'Doğal Soya Mumları ve Lüks Mermer Tepsi',
      'Keten Dokulu Dekoratif Kırlent ve Rustik Koltuk Köşesi'
    ],
    descriptions: [
      'Doğal ışık alan modern bir odada çekilmiş, el yapımı seramik kahve kupası ve şık ahşap sunum tepsisi. Ev dekorasyon ve sakin yaşam konsepti.',
      'Toprak tonlarında mat seramik saksı içerisinde kurutulmuş pampas otu ve keten detaylı arka plan. Minimalist iç mekan tasarımı ve sıcak atmosfer.',
      'Sakinleştirici aromaterapi etkili el yapımı soya mumu, mermer sunum tepsisi üzerinde yanarken. Estetik spa ve evde kişisel bakım teması.',
      'Doğal keten kumaştan üretilmiş bej rengi minder, ahşap mobilya üzerinde estetik ve rahat bir köşe oluştururken. Sıcak İskandinav ev stili.'
    ],
    keywords: [
      'ev dekorasyonu, seramik kupa, minimalist yaşam, iskandinav tarzı, kahve keyfi, el yapımı seramik, ahşap tepsi, doğal yaşam, estetik oda, bohem dekorasyon, toprak tonları, sakin atmosfer, kurutulmuş çiçekler, soya mumu, mermer tepsi, keten minder, rustik stil, sıcak yuva, ev tekstili, el emeği'
    ],
    ecommerce: {
      title: 'El Yapımı Seramik Kahve Kupası | Özel Tasarım Kupa Bardak | Hediye Kupa Bardak - Minimalist İskandinav Serisi',
      description: `✨ Evinize ve kahve saatlerinize estetik katacak tamamen el yapımı seramik kupa.
      
• Malzeme: Yüksek kaliteli stoneware kil ve gıdaya uygun mat sır.
• Hacim: Yaklaşık 320 ml.
• Kullanım: Bulaşık makinesinde yıkanabilir ancak el yapımı ürünlerin uzun ömürlü olması için elde yıkama önerilir.
• Hediye Seçeneği: Şık kraft kutusunda, korumalı ambalajıyla gönderilir. Doğum günü, yeni ev hediyesi veya kendiniz için harika bir tercihtir.
      
Not: Her ürün el yapımı olduğu için form ve sır dağılımlarında hafif farklılıklar bulunabilir, bu da her kupayı benzersiz kılar.`,
      tags: 'seramik kupa, el yapimi kupa, kahve kupasi, tasarim kupa, hediye bardak, mutfak dekoru, iskandinav kupa, kahve fincani, el yapimi seramik, dogal kupa, hediye fikirleri, kahve sever, estetik bardak'
    }
  },
  cosmetics: {
    name: 'Kozmetik & Güzellik',
    titles: [
      'Cam Şişede Nemlendirici Cilt Bakım Serumu ve Damlalık',
      'Organik Bileşenli Yüz Kremi ve Ahşap Spatula',
      'Doğal Kil Maskesi ve Ekolojik Bambu Fırça',
      'Yumuşak Işıkta Kozmetik Yağ Şişesi ve Gül Yaprakları'
    ],
    descriptions: [
      'Temiz içerikli nemlendirici yüz serumu, şeffaf cam şişesi ve damlalığı ile minimalist bir arka planda. Lüks cilt bakımı ve güzellik rutini.',
      'Ahşap spatulası ile mat cam kavanozda sunulan besleyici organik gece kremi. Doğal güzellik ve wellness konseptli ürün fotoğrafı.',
      'Seramik kase içerisinde hazırlanmış yeşil kil maskesi ve bambu uygulama fırçası. Cilt arındırma, detoks ve spa salonu teması.',
      'Cam damlalıklı şişede bitkisel masaj yağı ve etrafında taze pembe gül yaprakları. Aromaterapi, gevşeme ve doğal kozmetik ürün çekimi.'
    ],
    keywords: [
      'cilt bakımı, yüz serumu, kozmetik şişesi, organik güzellik, doğal kozmetik, cam damlalık, nemlendirici serum, spa ve wellness, temiz içerik, cilt bakımı rutini, güzellik ürünü, masaj yağı, kil maskesi, organik krem, bambu fırça, aromaterapi, bitkisel yağ, lüks kozmetik, pürüzsüz cilt, kişisel bakım'
    ],
    ecommerce: {
      title: 'Organik Nemlendirici Cilt Bakım Serumu | %100 Doğal Hyalüronik Asit & Vegan Yüz Serumu - Anti-Aging Parıltı',
      description: `🌿 Cildinizin ihtiyacı olan yoğun nemi ve ışıltıyı doğal yollarla geri kazanın.
      
• İçerik: Hyalüronik Asit, Aloe Vera Ekstratı, Organik Gül Suyu ve Vitamin E. 
• Etki: Cildin alt katmanlarına nüfuz ederek ince çizgileri dolgunlaştırır, yoğun nem bariyeri oluşturur.
• Kullanım: Temizlenmiş yüz ve boyun bölgesine günde iki kez 3-4 damla masaj yaparak uygulayın.
• Özellikler: Paraben, sülfat, parfüm ve yapay renklendirici içermez. Hayvanlar üzerinde test edilmemiştir (Cruelty-Free).
      
Hacim: 30ml damlalıklı kehribar cam şişe.`,
      tags: 'yuz serumu, cilt bakimi, organik serum, dogal kozmetik, nemlendirici, hyaluronik asit, vegan kozmetik, anti aging, temiz icerik, pariltili cilt, gozenek sikilastirici, hediye kozmetik, leke karsiti'
    }
  },
  tech: {
    name: 'Teknoloji & Aksesuar',
    titles: [
      'Zarif Tasarımlı Kablosuz Kulak Üstü Bluetooth Kulaklık',
      'Mat Siyah Akıllı Saat ve Manyetik Şarj Ünitesi',
      'Minimalist Çalışma Masasında Metalik Dizüstü Bilgisayar',
      'İnce Tasarımlı Akıllı Telefon ve Kablosuz Şarj Standı'
    ],
    descriptions: [
      'Gelişmiş gürültü engelleme özelliğine sahip, mat gri premium kablosuz kulaküstü kulaklık. Temiz ve şık stüdyo arka planında teknoloji ürünü çekimi.',
      'Sağlık takibi ve spor modları aktif olan mat siyah paslanmaz çelik akıllı saat, minimalist standı üzerinde. Modern giyilebilir teknoloji detayı.',
      'Alüminyum gövdeli ince dizüstü bilgisayar, şık bir çalışma masası düzeninde kapalı halde dururken. Home office ve verimlilik konsepti.',
      'Üç kameralı lüks akıllı telefon, yanık turuncu tonlarında deri kılıfı ile dikey kablosuz şarj ünitesinde dururken. Mobil teknoloji ve aksesuar.'
    ],
    keywords: [
      'akıllı saat, kablosuz kulaklık, bluetooth kulaklık, giyilebilir teknoloji, akıllı telefon, dizüstü bilgisayar, teknoloji aksesuarı, mat siyah, metalik tasarım, minimalist çalışma masası, home office, premium kulaklık, kablosuz şarj, telefon kılıfı, verimlilik, ses sistemleri, spor saati, deri kılıf, modern ofis, lüks teknoloji'
    ],
    ecommerce: {
      title: 'Premium Aktif Gürültü Engelleyici (ANC) Kablosuz Bluetooth Kulaklık | 40 Saat Çalma Süreli Kulak Üstü Kulaklık - Mat Siyah',
      description: `🎧 Dış dünyayı sessize alın ve müziğin derinliklerine odaklanın.
      
• Ses Kalitesi: Hi-Res Audio sertifikalı, 40mm dinamik sürücüler ile derin bas ve kristal netliğinde tizler.
• Aktif Gürültü Engelleme (ANC): Dış sesleri %90'a varan oranda bloke eder.
• Pil Ömrü: Tek şarjla ANC açıkken 30 saat, ANC kapalıyken 40 saate varan kullanım. Type-C hızlı şarj desteği (10 dk şarj ile 4 saat dinleme).
• Bağlantı: Bluetooth 5.2 ile gecikmesiz ve stabil bağlantı. Çok noktalı bağlantı sayesinde aynı anda iki cihaza bağlanabilir.
      
Paket İçeriği: Premium Seyahat Çantası, Type-C Şarj Kablosu, 3.5mm Aux Kablosu ve Kullanım Kılavuzu.`,
      tags: 'bluetooth kulaklik, kablosuz kulaklik, gürültü engelleyici, anc kulaklik, siyah kulaklik, muzik kulakligi, oyuncu kulakligi, teknoloji hediye, seyahat kulakligi, yuksek ses kalitesi, kulakustu kulaklik, premium ses'
    }
  },
  food: {
    name: 'Yiyecek & İçecek',
    titles: [
      'Taze Çekilmiş Kahve Çekirdekleri ve Kahve Demleme Ekipmanı',
      'Karanlık Arka Planda Sızma Zeytinyağı Şişesi ve Biberiye',
      'Ahşap Tahtada Taze Pişmiş Ekşi Mayalı Ekmek Dilimleri',
      'Cam Bardakta Buzlu Hibiskus Çayı ve Taze Nane Yaprakları'
    ],
    descriptions: [
      'Pour-over (V60) yöntemiyle taze demlenen filtre kahve süzülürken etrafındaki kavrulmuş kahve çekirdekleri. Nitelikli kahve kültürü fotoğrafı.',
      'Rustik koyu renkli ahşap masada, koyu yeşil cam şişe içerisinde ev yapımı soğuk sıkım sızma zeytinyağı ve taze kekik, biberiye dalları.',
      'Fırından yeni çıkmış, çıtır kabuklu, içi gözenekli organik ekşi mayalı ekmek. Keten bez üzerinde rustik fırıncılık sanatı çekimi.',
      'Yaz aylarında ferahlatıcı kırmızı hibiskus çayı, şeffaf cam bardakta eriyen buz küpleri ve taze yeşil nane ile. Doğal soğuk içecek konsepti.'
    ],
    keywords: [
      'filtre kahve, kahve çekirdeği, zeytinyağı, organik gıda, ekşi mayalı ekmek, fırıncılık, soğuk içecek, hibiskus çayı, rustik yemek çekimi, taze baharatlar, soğuk sıkım, organik zeytinyağı, v60 demleme, nitelikli kahve, kahve dükkanı, sağlıklı beslenme, el yapımı ekmek, taze nane, buzlu çay, gurme lezzetler'
    ],
    ecommerce: {
      title: 'Ege Esintisi Soğuk Sıkım Sızma Zeytinyağı | %100 Organik Erken Hasat Zeytinyağı - 500 ml Şık Cam Şişe',
      description: `🌿 Ege'nin asırlık zeytin ağaçlarından erken hasat edilen zeytinlerin, soğuk sıkım yöntemiyle sıkılmasıyla elde edilen üstün kaliteli sızma zeytinyağı.
      
• Hasat Zamanı: Ekim - Kasım ayları (Erken hasat, yeşil zeytinlerden).
• Asitlik Derecesi: Maksimum %0.3 oleik asit oranı (Ultra düşük asit).
• Üretim Yöntemi: 22°C altında soğuk sıkım uygulanarak zeytindeki polifenol ve antioksidan değerleri en üst düzeyde korunmuştur.
• Lezzet Profilui: Taze biçilmiş çimen, yeşil elma ve domates yaprağı aromalarıyla zengin, boğazda hafif yakıcılık bırakan meyvemsi tat.
      
Salatalarınız, mezeleriniz ve soğuk yemekleriniz için mükemmel bir gurme dokunuş.`,
      tags: 'sizma zeytinyagi, soguk sikim, erken hasat, organik zeytinyagi, gurme lezzet, dogal yag, ege zeytinyagi, salata yagi, saglikli beslenme, cam sise yag, hediye zeytinyagi, premium zeytinyagi, hakiki zeytinyagi'
    }
  },
  landscape: {
    name: 'Doğa & Manzara',
    titles: [
      'Sis Altındaki Çam Ormanı ve Dumanlı Dağ Zirveleri',
      'Gün Batımında Dalgalı Deniz ve Altın Rengi Yansımalar',
      'Sonbaharda Altın Sarısı Yapraklarla Kaplı Orman Yolu',
      'Yıldızlı Gökyüzü Altında Karlı Kamp Çadırı'
    ],
    descriptions: [
      'Sabahın erken saatlerinde sis tabakası ile kaplanmış görkemli dağ sırası ve sık çam ağaçları. Doğu Karadeniz yaylalarında vahşi doğa ve macera.',
      'Akşam güneşinin batışında, köpüklü okyanus dalgalarının kumsala vururken yarattığı altın renkli ışık yansımaları. Huzurlu doğa ve tatil teması.',
      'Sonbaharın sıcak renklerini barındıran sarı ve turuncu yaprakların döküldüğü, derinlere uzanan patika orman yolu. Dinginlik ve mevsim geçişi.',
      'Kış kampı konseptinde, berrak gökyüzündeki Samanyolu galaksisinin altında içten aydınlatılmış turuncu kamp çadırı. Macera ve outdoor sporları.'
    ],
    keywords: [
      'çam ormanı, sisli dağlar, karadeniz yaylası, gün batımı, deniz dalgaları, altın saat, sonbahar yaprakları, orman yolu, kış kampı, kamp çadırı, samanyolu, yıldızlı gökyüzü, vahşi doğa, manzara fotoğrafı, outdoor macera, seyahat rotaları, dinginlik, seyahat günlüğü, dağ tırmanışı, doğa yürüyüşü'
    ],
    ecommerce: {
      title: 'Sisli Çam Ormanı Manzaralı Premium Duvar Posteri | Büyük Boy Doğa Temalı Tablo - Sanatsal Çerçeveli Baskı',
      description: `🌲 Evinizin veya ofisinizin havasını değiştirecek, doğanın huzurunu duvarlarınıza taşıyacak özel sanatsal fotoğraf baskısı.
      
• Baskı Kalitesi: 250gr müze kalitesinde asitsiz mat fine art kağıdına ultra-yüksek çözünürlüklü baskı.
• Çerçeve Detayı: Minimalist mat siyah ahşap çerçeve ve kırılmaya dayanıklı yüksek şeffaflıkta pleksiglas koruma.
• Askı Aparatı: Arkasında hazır monte edilmiş çelik askı teli ile asılmaya hazır gönderilir.
• Ölçü Seçenekleri: 35x50 cm, 50x70 cm, 70x100 cm.
      
Tüm gönderilerimiz kırılmaya karşı garantili, özel korumalı ahşap sandık kutularda yapılmaktadır.`,
      tags: 'duvar posteri, doga tablosu, cerceveli tablo, orman posteri, minimalist tablo, fine art baski, ev hediyesi, salon dekoru, büyük boy poster, sanatsal fotograf, manzara tablosu, modern cerceve, ofis tablosu'
    }
  },
  fashion: {
    name: 'Moda & Giyim',
    titles: [
      'Stüdyoda Modern Kot Ceket ve Beyaz Tişört Kombini',
      'Sokak Stilinde Şık Kadın Güneş Gözlüğü ve Trençkot',
      'Retro Tarzı Deri Çizme ve Dokuma Çanta Detayı',
      'Pastel Tonlarda Yazlık Şapka ve Keten Elbise'
    ],
    descriptions: [
      'Minimalist stüdyo ışığında, yeni sezon denim ceket ve spor şıklık konseptli giyim fotoğrafı.',
      'Güneşli bir günde şehir merkezinde yürüyen, şık güneş gözlüğü ve klasik trençkotuyla stil sahibi bir kadın.',
      'Eski sokak kaldırımlarında retro tarzı kahverengi deri çizmeler ve omuzda el dokuması keten çanta.',
      'Kumsalda veya yaz partisinde giyilebilecek, hasır şapka ve uçuşan bej keten elbise detayı.'
    ],
    keywords: [
      'moda giyim, kot ceket, sokak stili, trençkot, güneş gözlüğü, yeni sezon, stüdyo çekimi, retro giyim, deri çizme, el dokuması çanta, yazlık elbise, keten kumaş, hasır şapka, stil kombin, şık giyim, genç tarzı, sonbahar modası, tekstil ürünü, gardırop, günlük şıklık'
    ],
    ecommerce: {
      title: 'Unisex Oversize Denim Ceket | Yeni Sezon Premium Kot Ceket - Klasik Mavi',
      description: `🧥 Gardırobunuzun kurtarıcı parçası olacak, zamansız tasarıma sahip premium kot ceket.
      
• Kumaş: %100 pamuklu denim, dayanıklı ve nefes alabilir doku.
• Kalıp: Modern oversize kesim, her bedene uyumlu kalıp.
• Detay: Metal paslanmaz düğmeler ve fonksiyonel 4 adet cep.
• Yıkama: 30 derecede tersten yıkayınız.
      
Hem spor hem de şık kombinleriniz için mükemmel bir tamamlayıcıdır.`,
      tags: 'kot ceket, denim ceket, oversize ceket, unisex ceket, mavi ceket, spor mont, yeni sezon giyim, sokak modasi, premium denim, pamuklu ceket, trend ceket, hediye giyim, jean ceket'
    }
  },
  fitness: {
    name: 'Spor & Sağlıklı Yaşam',
    titles: [
      'Yoga Matı Üzerinde Egzersiz Yapan Kadın ve Spor Matarası',
      'Koşu Pistinde Koşu Ayakkabısı Detayı ve Akşam Üstü Işığı',
      'Fitness Salonunda Çelik Dambıllar ve Ter Havlusu',
      'Doğal Ahşap Masada Detoks Smoothie ve Taze Meyveler'
    ],
    descriptions: [
      'Sakin bir stüdyoda, yeşil yoga matı üzerinde egzersiz hareketleri yapan sporcu kadın ve yanında çelik matara.',
      'Gün batımına yakın saatte parkurdaki koşucunun spor ayakkabıları ve dinamik hareket anı.',
      'Profesyonel fitness salonunda ağırlık sehpası üzerinde duran krom kaplı dambıllar ve mikrofiber havlu.',
      'Cam şişede yeşil ıspanak ve muz smoothie, etrafında taze kesilmiş kivi ve chia tohumları.'
    ],
    keywords: [
      'sağlıklı yaşam, yoga matı, sporcu matarası, egzersiz, koşu ayakkabısı, spor salonu, dambıl ağırlık, detoks smoothie, yeşil içecek, chia tohumu, sporcu beslenmesi, kardiyo, fitness antrenmanı, pilates, sağlıklı beslenme, aktif yaşam, ter havlusu, motivasyon, sabah sporu, esneme hareketleri'
    ],
    ecommerce: {
      title: 'Çift Renkli Kaydırmaz TPE Yoga ve Pilates Matı | 6mm Kalınlık Spor Matı - Ekolojik ve Dayanıklı',
      description: `🧘‍♀️ Egzersizlerinizi daha konforlu ve güvenli hale getirecek, yüksek yoğunluklu kaydırmaz yoga matı.
      
• Malzeme: Çevre dostu, geri dönüştürülebilir TPE (Lateks ve PVC içermez).
• Kalınlık: 6mm optimum kalınlık ile eklemlerinizi korur ve dengeyi kolaylaştırır.
• Dokusu: Çift taraflı kaymaz özel dokulu yüzey, terleme durumunda dahi tam tutuş sağlar.
• Boyut: 183 cm x 61 cm.
• Taşıma: Kolay taşıma askısı ve özel kılıfı ile birlikte gönderilir.
      
Yoga, pilates, fitness ve ev egzersizleri için idealdir.`,
      tags: 'yoga mati, pilates mati, spor mati, kaydirmaz mat, egzersiz mati, evde spor, fitness ekipmani, tpe mat, saglikli yasam, pilates malzemesi, mavi mat, spor hediye, dayanikli mat'
    }
  },
  business: {
    name: 'İş Dünyası & Ofis',
    titles: [
      'Modern Toplantı Odasında Beyaz Tahta ve Çalışanlar',
      'Ofis Masasında Tasarımcı Çizim Tableti ve Not Defteri',
      'Finansal Grafik Analizi Yapan Analist ve Hesap Makinesi',
      'Cam Arkasında Beyin Fırtınası Yapan Genç Ekip'
    ],
    descriptions: [
      'Geniş pencereli aydınlık bir toplantı odasında beyin fırtınası yapan, beyaz tahtaya notlar alan profesyonel ekip.',
      'Grafik tasarımcının masasında çizim tableti, dokunmatik kalem ve üzerine kahve fincanı konmuş şık bir not defteri.',
      'Işıklı bir ortamda açık renkli kağıtlara basılmış bütçe ve satış grafiklerini analiz eden uzman.',
      'Ofisin cam bölmesine renkli yapışkan notlar asarak yeni projeyi planlayan genç girişimci ekibi.'
    ],
    keywords: [
      'iş dünyası, toplantı odası, beyin fırtınası, ofis masası, grafik tablet, çizim kalemi, finansal analiz, satış grafiği, genç girişimciler, yapışkan notlar, iş birliği, ofis ortamı, kurumsal hayat, kariyer, modern ofis, planlama toplantısı, iş yönetimi, veri analizi, dijital tasarım, ekip çalışması'
    ],
    ecommerce: {
      title: 'Akıllı Deri Sümen ve Ofis Masası Düzenleyici | Premium Deri Klavye Fare Altlığı - Büyük Boy Kahverengi',
      description: `💼 Ofis masanıza lüks ve düzen getirecek, birinci sınıf el yapımı deri sümen.
      
• Malzeme: %100 birinci kalite suni deri (kolay temizlenir, sıvı geçirmez).
• Ölçü: 80 cm x 40 cm geniş yüzey alanı (klavye, fare ve laptopu rahatça alır).
• Koruma: Masanızı çizilmelere, lekelere ve ısıya karşı mükemmel korur.
• Alt Yüzey: Kaymaz süet alt zemin sayesinde masaya tam oturur.
      
Çalışma alanınızı şık ve işlevsel bir ofise dönüştürün.`,
      tags: 'deri sumen, masa duzenleyici, ofis aksesuari, fare altligi, mouse pad buyuk, calisma masasi, hediye ofis, kurumsal hediye, kahverengi sumen, şık ofis, home office aksesuari, laptop matı, tasarim ofis'
    }
  },
  architecture: {
    name: 'Mimari & Yapı',
    titles: [
      'Gökdelen Camından Şehir Manzarası ve Geometrik Yapılar',
      'Modern Müze Binasının Spiral Merdivenleri ve Işık Oyunu',
      'Loft Tarzı Ev İçinde Tuğla Duvar ve Çelik Kirişler',
      'Tarihi Taş Konağın Ahşap Pencereleri ve Sarmaşıklar'
    ],
    descriptions: [
      'Modern mimariye sahip gökdelenlerin birbirine yansıyan cam yüzeyleri ve yukarı doğru çekilmiş geometrik kadraj.',
      'Sanat müzesinin betonarme mimarisindeki devasa spiral merdivenler ve yukarıdan süzülen doğal gün ışığı.',
      'Yüksek tavanlı loft dairede endüstriyel esintili tuğla duvar kaplaması, siyah metal detaylar ve sarkıt lambalar.',
      'Geleneksel mimariye uygun restore edilmiş taş evin, kemerli ahşap pencereleri etrafını saran yeşil sarmaşıklar.'
    ],
    keywords: [
      'modern mimari, gökdelenler, geometrik yapılar, spiral merdivenler, müze binası, iç mekan tasarımı, loft daire, tuğla duvar, endüstriyel tasarım, taş konak, ahşap pencere, sarmaşıklar, betonarme, ışık yansıması, kentsel doku, restorasyon, bina cephesi, minimal mimari, mimari detay, sanat galerisi'
    ],
    ecommerce: {
      title: '3D Tuğla Desenli Kendinden Yapışkanlı Duvar Paneli | Isı ve Ses Yalıtımlı Dekoratif Duvar Kağıdı - 10 Adet Paket',
      description: `🧱 Usta çağırmadan, kendi başınıza evinizin havasını değiştirebileceğiniz yapışkanlı dekoratif panel.
      
• Malzeme: Yumuşak polietilen köpük (darbelere karşı koruyucudur, çocuk odalarına uygundur).
• Özellik: Suya, neme ve ısıya dayanıklıdır. Kolayca silinebilir.
• Uygulama: Arkasındaki koruyucu bandı çıkarıp temiz duvara yapıştırmanız yeterlidir. Makasla kolayca kesilebilir.
• Boyut: Her bir panel 70 cm x 77 cm ölçülerindedir.
      
Salon, mutfak, koridor veya ofis duvarlarında modern tuğla görünümü elde etmek için en pratik çözümdür.`,
      tags: 'duvar paneli, yapiskanli panel, tugla desenli, duvar kagidi, ev dekorasyon, yalitimli panel, pratik dekorasyon, salon duvari, 3d duvar kagidi, kopuk panel, kendin yap duvar, beyaz tugla, dekoratif kaplama'
    }
  },
  animals: {
    name: 'Evcil Hayvanlar & Vahşi Yaşam',
    titles: [
      'Pencere Kenarında Güneşlenen Sevimli Tekir Kedi',
      'Parkta Koşan Golden Retriever Köpek ve Islak Burun',
      'Akvaryumda Süzülen Parlak Turuncu Japon Balığı',
      'Daldaki Yeşil Muhabbet Kuşu ve Renkli Tüyler'
    ],
    descriptions: [
      'Güneş ışığının vurduğu pencere eşiğinde uzanmış, yeşil gözlü sevimli bir tekir kedi.',
      'Yeşillikler içinde dili dışarıda koşan, mutlu ve enerjik bir Golden Retriever cinsi köpek.',
      'Akvaryum bitkileri arasında süzülen, pulları parıldayan sevimli turuncu süs balığı.',
      'Kafes dışında veya doğal ortamında, ahşap tünekte dik duran canlı sarı-yeşil muhabbet kuşu.'
    ],
    keywords: [
      'evcil hayvan, tekir kedi, sevimli kedi, kedi gözleri, golden retriever, mutlu köpek, köpek eğitimi, japon balığı, akvaryum bitkileri, muhabbet kuşu, renkli tüyler, hayvan sevgisi, veterinerlik, kedi maması, köpek oyuncağı, evde kedi besleme, evcil hayvan bakımı, doğa ve hayvanlar, tatlı pati, patili dostlar'
    ],
    ecommerce: {
      title: 'Ortopedik Yatıştırıcı Peluş Kedi ve Köpek Yatağı | Yıkanabilir Pofuduk Yuvarlak Evcil Hayvan Yatağı - Gri (60cm)',
      description: `🐱 Evcil dostlarınızın en rahat ve derin uykularını çekmesi için tasarlanmış, ultra yumuşak peluş yatak.
      
• Malzeme: Birinci sınıf pofuduk peluş kumaş ve içi dolgulu antibakteriyel boncuk elyaf.
• Tasarım: Yuvarlak simit tasarımı sayesinde kediniz veya köpeğiniz kendini güvende ve sarılmış hisseder.
• Taban: Kaymaz ve su geçirmez alt taban ile zeminlerde sabit durur.
• Temizlik: Çamaşır makinesinde 30 derecede hassas programda yıkanabilir.
• Boyut: 60 cm çap (küçük ve orta boy kedi-köpekler için idealdir).
      
Dostunuzun eklem ağrılarını hafifletmeye yardımcı olur ve stresi azaltır.`,
      tags: 'kedi yatagi, kopek yatagi, pelus yatak, evcil hayvan yatagi, pofuduk yatak, ortopedik yatak, kedi yuvasi, kopek yuvasi, yikanabilir yatak, kedi malzemesi, gri yatak, evcil hayvan aksesuari, rahat uyku'
    }
  },
  travel: {
    name: 'Seyahat & Kültür',
    titles: [
      'Eski Şehir Sokaklarında Renkli Evler ve Arnavut Kaldırımı',
      'Dağ Eteğindeki Tarihi Kale ve Yemyeşil Vadi Manzarası',
      'Baharat Pazarında Çuvallardaki Renkli Egzotik Baharatlar',
      'Sırt Çantalı Gezginin Harita ve Pusula ile Yol Bulması'
    ],
    descriptions: [
      'Tarihi mahallede, iki yanında pastel tonlarda boyanmış pencereli evler bulunan taş döşeli eski sokak.',
      'Sarp kayalıkların üzerine inşa edilmiş görkemli tarihi kale kalıntıları ve aşağıda uzanan nehir vadisi.',
      'Geleneksel çarşıda yan yana dizilmiş çuvallarda kırmızı pul biber, sarı zerdeçal, kakule ve tarçın kabukları.',
      'Seyahat halindeki bir turistin ahşap masa üzerinde dünya haritası ve pirinç pusula yardımıyla rotasını çizmesi.'
    ],
    keywords: [
      'seyahat, eski şehir, renkli evler, arnavut kaldırımı, tarihi kale, yeşil vadi, baharat pazarı, egzotik baharatlar, sırt çantalı gezgin, dünya haritası, pusula, turizm, tatil rotası, tarih ve kültür, gezi günlüğü, macera seyahati, kültürel miras, eski sokaklar, kaşif, fotoğraf gezisi'
    ],
    ecommerce: {
      title: 'Su Geçirmez Çok Fonksiyonlu Seyahat Sırt Çantası | USB Şarj Girişli Geniş Hacimli Valiz Çanta - Unisex Siyah',
      description: `✈️ Seyahatlerinizde, iş gezilerinizde veya günlük hayatta tüm eşyalarınızı düzenli tutacak akıllı sırt çantası.
      
• Malzeme: Yüksek yoğunluklu suya dayanıklı oxford kumaş.
• Bölmeler: 15.6 inç özel korumalı laptop bölmesi, ıslak/kuru eşya ayırma cebi ve gizli pasaport gözü.
• Şarj Portu: Dahili USB bağlantı noktası ile yürürken telefonunuzu kolayca şarj edin (powerbank içeride kalır).
• Ergonomi: Nefes alabilen file sırt desteği ve valiz askı kemeri ile konforlu taşıma.
• Boyut: 45 cm x 30 cm x 20 cm (kabin boy ölçülerine uygundur).
      
Hafta sonu kaçamakları ve uzun seyahatler için vazgeçilmez bir yardımcıdır.`,
      tags: 'seyahat cantasi, sirt cantasi, laptop cantasi, kabin boy canta, su gecirmez canta, usbli canta, valiz canta, siyah sirt cantasi, unisex canta, dagci cantasi, kamp cantasi, seyahat ekipmanlari, hediye canta'
    }
  },
  automotive: {
    name: 'Otomotiv & Taşıtlar',
    titles: [
      'Gece Şehir Işıklarında Spor Arabanın Ön Izgarası ve Farları',
      'Tozlu Yolda İlerleyen Off-Road Arazi Aracı ve Çamur Detayı',
      'Klasik Kırmızı Motosiklet ve Deri Kask Detayı',
      'Güneş Batımında Boş Otobanda Hızla İlerleyen Araba'
    ],
    descriptions: [
      'Gece saatlerinde neon ışıkların yansıdığı, keskin hatlı lüks spor otomobilin mercekli LED farları.',
      'Dağlık arazide çamurlu su birikintisinden hızla geçerek su fışkırtan 4x4 arazi aracının dinamik anı.',
      'Garajda veya sahil yolunda park edilmiş, parıldayan krom aksamlı vintage motosiklet ve gidonda deri kask.',
      'Ufuk çizgisinde batan güneşin turuncu ışığı altında, uzun otobanda kaybolan modern binek araç.'
    ],
    keywords: [
      'otomotiv, spor araba, led farlar, lüks otomobil, off-road, arazi aracı, 4x4, çamurlu yol, klasik motosiklet, vintage motor, deri kask, otoban, gün batımı sürüşü, otomobil tasarımı, hız tutkusu, sürüş keyfi, araba modifiyesi, araç bakımı, motor aksesuarları, yol manzarası'
    ],
    ecommerce: {
      title: 'Yüksek Çözünürlüklü Gece Görüşlü Araç İçi Kamera | Full HD 1080P G-Sensörlü Oto Yol Kayıt Cihazı - 170 Derece Açı',
      description: `🚗 Sürüş güvenliğinizi en üst duyeye çıkaran, kaza anını otomatik kilitleyen akıllı araç kamerası.
      
• Çözünürlük: Real 1080P Full HD kayıt kalitesi ile plaka ve detayları net yakalar.
• Görüş Açısı: 170 derece ultra geniş açı sayesinde şeritlerin tamamını görüntüler.
• Gece Görüşü: WDR teknolojisi ile gece ve düşük ışıkta yüksek kaliteli görüntü kaydeder.
• G-Sensör: Olası sarsıntı veya kaza anında video kaydını kilitler, üzerine yazılmasını engeller.
• Döngüsel Kayıt: Hafıza kartı dolduğunda en eski kilitlenmemiş videoların üzerine otomatik yazar.
      
Kurulumu kolay vantuzlu standı ve araç şarj kiti ile birlikte eksiksiz gelir.`,
      tags: 'arac kamerasi, oto kamera, yol kayit cihazi, hd kamera, gece goruslu kamera, arac ici aksesuarlar, g sensorlu kamera, kaza kamerasi, oto elektronik, guvenli surus, 1080p kamera, araba kamerasi'
    }
  },
  portrait: {
    name: 'İnsanlar & Portre',
    titles: [
      'Açık Havada Gülen Genç Kadının Portre Fotoğrafı',
      'Kitap Okuyan Yaşlı Adamın Düşünceli Yüz İfadesi',
      'Birlikte Gülen Aile ve Çocukların Parktaki Mutluluğu',
      'Doğal Işıkta Çalışan Zanaatkarın Odaklanmış Elleri'
    ],
    descriptions: [
      'Arka planı bulanık (bokeh etkili), gün ışığında kameraya samimi bir gülümsemeyle bakan genç kadın portresi.',
      'Kütüphanede veya evinde, gözlüğü burnunun ucunda elindeki eski kitabı okuyan bilge yaşlı adam portresi.',
      'Güneşli bir günde çimler üzerinde uzanmış, birbirine sarılarak kahkaha atan anne, baba ve çocuk.',
      'Atölyesinde kil çömleğe şekil verirken veya ahşap oyarken zanaatkarın detaylı el hareketleri ve alın teri.'
    ],
    keywords: [
      'insan portresi, gülen kadın, açık hava çekimi, bokeh arka plan, yaşlı adam, kitap okuma, aile mutluluğu, çocuk gülüşü, parkta piknik, zanaatkar elleri, odaklanma, samimi ifade, insan duyguları, yaşam tarzı, günlük yaşam, portre fotoğrafçılığı, doğal ışık, atölye çalışma, anne cocuk, mutlu anlar'
    ],
    ecommerce: {
      title: 'Taşınabilir LED Halka Işık ve Tripod Seti | TikTok ve YouTube Canlı Yayın Lambası - 3 Renk Modu 10 Seviye Parlaklık',
      description: `📸 Profesyonel portre çekimleri, makyaj videoları ve canlı yayınlar için ideal halka ışık standı.
      
• Işık Çapı: 10 inç (26 cm) LED halka ışık.
• Renk Modları: Sıcak Sarı, Doğal Beyaz, Soğuk Beyaz olmak üzere 3 farklı renk tonu.
• Parlaklık: Her renk modu için 10 kademeli parlaklık ayarı (Toplam 30 farklı ışık kombinasyonu).
• Tripod Standı: Ayarlanabilir yükseklik (50 cm - 160 cm arası) ve 360 derece dönebilen telefon tutucu başlık.
• Bağlantı: USB kablosu ile bilgisayara, powerbanke veya priz adaptörüne bağlanarak çalışır.
      
Fotoğraf ve video çekimlerinizde gölgeleri yok eder, gözlerde estetik halka yansıması oluşturur.`,
      tags: 'halka isik, ring light, tripodlu isik, yayin isigi, makyaj lambasi, fotograf aksesuari, youtube isigi, telefon tripodu, led halka isik, portre cekimi, isik standi, taşinabilir isik, video ekipmani'
    }
  },
  other: {
    name: 'Diğer / Genel',
    titles: [
      'Stüdyo Işığında Minimalist Nesne Çekimi',
      'Renkli Soyut Desen ve Doku Detayı',
      'Modern Arka Planda Profesyonel Ürün Çekimi',
      'Yaratıcı Konsept Fotoğrafı ve Derinlik'
    ],
    descriptions: [
      'Minimalist ve temiz bir stüdyo ortamında çekilmiş, profesyonel ürün veya konsept fotoğrafı.',
      'Canlı renklere ve estetik geçişlere sahip, tasarım projelerinde kullanılabilecek soyut arka plan dokusu.',
      'Modern ve şık bir arka plan önünde, detayları ön plana çıkarılmış yüksek kaliteli nesne fotoğrafı.',
      'Yaratıcı fikirleri ve sanatsal bakış açısını yansıtan, derinlik algısı yüksek konsept stüdyo çekimi.'
    ],
    keywords: [
      'minimalist çekim, stüdyo fotoğrafı, ürün çekimi, soyut desen, renkli doku, profesyonel fotoğrafçılık, yüksek kalite, konsept tasarımı, sanatsal bakış, modern arka plan, estetik görsel, nesne çekimi, yaratıcı konsept, tasarım elementi, parlak renkler, yumuşak ışık, detay çekimi, stok görsel, ticari kullanım, derinlik hissi'
    ],
    ecommerce: {
      title: 'Özel Tasarım Ürün | Çok Amaçlı Premium Tasarım Objesi',
      description: `✨ Hayatınıza estetik ve işlevsellik katacak, yüksek kaliteli malzemelerle üretilmiş özel tasarım ürün.
      
• Tasarım: Modern, şık ve minimalist çizgilere sahip benzersiz görünüm.
• Malzeme: Birinci sınıf kaliteli ve uzun ömürlü hammadde kullanımı.
• Kullanım: Evinizde, ofisinizde veya günlük hayatınızda çok amaçlı kullanıma uygun.
• Hediye: Özel ambalajlı kutusuyla sevdikleriniz için harika bir hediye alternatifi.
      
Tarzınızı yansıtacak detaylarla bezeli bu ürün, mekanınıza modern bir dokunuş kazandıracak.`,
      tags: 'tasarim urun, premium kalite, ozel tasarim, ev aksesuari, ofis aksesuari, cok amacli urun, hediye fikirleri, modern tasarim, estetik objeler, kaliteli urun, tasarim objesi, şık hediye, minimalist tarz'
    }
  }
};

export function getCategories() {
  return Object.keys(CATEGORY_TEMPLATES).map(key => ({
    key: key,
    name: CATEGORY_TEMPLATES[key].name
  }));
}

export function generateAIData(categoryKey, filename = '') {
  // If no category selected, try to infer from filename
  let selectedCategory = categoryKey;
  if (!selectedCategory && filename) {
    const lowerFn = filename.toLowerCase();
    if (lowerFn.includes('kahve') || lowerFn.includes('kupa') || lowerFn.includes('vazo') || lowerFn.includes('mum') || lowerFn.includes('pillow') || lowerFn.includes('decor') || lowerFn.includes('yasam')) {
      selectedCategory = 'decor';
    } else if (lowerFn.includes('serum') || lowerFn.includes('krem') || lowerFn.includes('maske') || lowerFn.includes('yag') || lowerFn.includes('rose') || lowerFn.includes('skin') || lowerFn.includes('beauty') || lowerFn.includes('kozmetik')) {
      selectedCategory = 'cosmetics';
    } else if (lowerFn.includes('kulaklik') || lowerFn.includes('saat') || lowerFn.includes('phone') || lowerFn.includes('watch') || lowerFn.includes('laptop') || lowerFn.includes('tech') || lowerFn.includes('aksesuar')) {
      selectedCategory = 'tech';
    } else if (lowerFn.includes('yemek') || lowerFn.includes('oil') || lowerFn.includes('ekmek') || lowerFn.includes('coffee') || lowerFn.includes('food') || lowerFn.includes('tea') || lowerFn.includes('icecek')) {
      selectedCategory = 'food';
    } else if (lowerFn.includes('doga') || lowerFn.includes('sunset') || lowerFn.includes('forest') || lowerFn.includes('landscape') || lowerFn.includes('manzara') || lowerFn.includes('mountain')) {
      selectedCategory = 'landscape';
    } else if (lowerFn.includes('elbise') || lowerFn.includes('ceket') || lowerFn.includes('giyim') || lowerFn.includes('fashion') || lowerFn.includes('tisort') || lowerFn.includes('kombin')) {
      selectedCategory = 'fashion';
    } else if (lowerFn.includes('spor') || lowerFn.includes('yoga') || lowerFn.includes('fitness') || lowerFn.includes('mat') || lowerFn.includes('kosu') || lowerFn.includes('dambil')) {
      selectedCategory = 'fitness';
    } else if (lowerFn.includes('ofis') || lowerFn.includes('toplanti') || lowerFn.includes('is') || lowerFn.includes('sirket') || lowerFn.includes('grafik') || lowerFn.includes('business')) {
      selectedCategory = 'business';
    } else if (lowerFn.includes('mimari') || lowerFn.includes('bina') || lowerFn.includes('ev') || lowerFn.includes('loft') || lowerFn.includes('tasarim') || lowerFn.includes('architecture')) {
      selectedCategory = 'architecture';
    } else if (lowerFn.includes('kedi') || lowerFn.includes('kopek') || lowerFn.includes('pet') || lowerFn.includes('hayvan') || lowerFn.includes('animal') || lowerFn.includes('kus')) {
      selectedCategory = 'animals';
    } else if (lowerFn.includes('seyahat') || lowerFn.includes('gezi') || lowerFn.includes('harita') || lowerFn.includes('canta') || lowerFn.includes('travel') || lowerFn.includes('turist')) {
      selectedCategory = 'travel';
    } else if (lowerFn.includes('araba') || lowerFn.includes('motor') || lowerFn.includes('motosiklet') || lowerFn.includes('oto') || lowerFn.includes('car') || lowerFn.includes('hiz')) {
      selectedCategory = 'automotive';
    } else if (lowerFn.includes('insan') || lowerFn.includes('kadin') || lowerFn.includes('adam') || lowerFn.includes('aile') || lowerFn.includes('cocuk') || lowerFn.includes('portre') || lowerFn.includes('portrait')) {
      selectedCategory = 'portrait';
    }
  }
  
  // Fallback to random if still not selected
  if (!selectedCategory || !CATEGORY_TEMPLATES[selectedCategory]) {
    const keys = Object.keys(CATEGORY_TEMPLATES);
    selectedCategory = keys[Math.floor(Math.random() * keys.length)];
  }

  const template = CATEGORY_TEMPLATES[selectedCategory];
  
  // Select a random index from template lists to make generations varied
  const randomIndex = Math.floor(Math.random() * template.titles.length);
  const baseTitle = template.titles[randomIndex];
  const baseDesc = template.descriptions[randomIndex];
  const baseKeywords = template.keywords[0]; // String of keywords
  
  // Keywords array
  const kwList = baseKeywords.split(', ').map(k => k.trim());
  
  // Generate specific platforms metadata
  return {
    category: selectedCategory,
    // Raw Base
    title: baseTitle,
    description: baseDesc,
    keywords: baseKeywords,
    tags: template.ecommerce.tags,
    
    // Adobe Stock (Requires short clean titles and top keywords)
    adobe: {
      title: baseTitle,
      keywords: kwList.slice(0, 30).join(', ')
    },
    
    // Shutterstock (Requires descriptive titles, detailed descriptions, up to 50 keywords)
    shutterstock: {
      title: `${baseTitle} - Stok Fotoğrafı`,
      description: `${baseDesc} Yüksek çözünürlüklü ticari kullanım için ideal görsel.`,
      keywords: kwList.concat(['stok görsel', 'shutterstock', 'yüksek çözünürlük', 'fotoğrafçılık']).slice(0, 50).join(', ')
    },
    
    // Freepik (Editorial title, lowercase tags)
    freepik: {
      title: baseTitle.toLowerCase(),
      keywords: kwList.map(k => k.toLowerCase()).slice(0, 25).join(', ')
    },
    
    // Vecteezy (Clean title, tags)
    vecteezy: {
      title: baseTitle,
      description: baseDesc,
      keywords: kwList.slice(0, 20).join(', ')
    },
    
    // E-Ticaret / Ürün Satış (Tailored title, sales description, Etsy/Trendyol 13 tags)
    ecommerce: {
      title: template.ecommerce.title,
      description: template.ecommerce.description,
      tags: template.ecommerce.tags.split(', ').slice(0, 13).join(', ')
    }
  };
}

export async function generateGeminiMetadata(base64DataUrl, categoryKey, customApiKey = null) {
  // 1. Determine API Key
  const apiKey = customApiKey || import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error("Gemini API Anahtarı bulunamadı. Lütfen profilinizden bir anahtar ekleyin veya sunucu yöneticisiyle iletişime geçin.");
  }

  // 2. Map Category Name
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

  // 3. Parse base64DataUrl
  const regex = /^data:(image\/[a-zA-Z+.-]+);base64,(.+)$/;
  const matches = base64DataUrl.match(regex);
  if (!matches) {
    throw new Error("Geçersiz resim formatı.");
  }
  const mimeType = matches[1];
  const base64Data = matches[2];

  // 4. Construct Prompt
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

  // 5. Direct API request to Google Gemini
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
    throw new Error(errMsg);
  }

  const result = await response.json();
  const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error("API boş yanıt döndürdü.");
  }

  return JSON.parse(rawText.trim());
}
