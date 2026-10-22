// Category list and the client for the /api/generate metadata endpoint.
// Display names are translated via i18n (categories.<key>); these are fallbacks.

const CATEGORY_NAMES = {
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

export function getCategories() {
  return Object.keys(CATEGORY_NAMES).map(key => ({
    key: key,
    name: CATEGORY_NAMES[key]
  }));
}

export function detectCategoryFromFilename(filename) {
  if (!filename) return 'other';
  const lowerFn = filename.toLowerCase();
  if (lowerFn.includes('kahve') || lowerFn.includes('kupa') || lowerFn.includes('vazo') || lowerFn.includes('mum') || lowerFn.includes('pillow') || lowerFn.includes('decor') || lowerFn.includes('yasam')) {
    return 'decor';
  } else if (lowerFn.includes('serum') || lowerFn.includes('krem') || lowerFn.includes('maske') || lowerFn.includes('yag') || lowerFn.includes('rose') || lowerFn.includes('skin') || lowerFn.includes('beauty') || lowerFn.includes('kozmetik')) {
    return 'cosmetics';
  } else if (lowerFn.includes('kulaklik') || lowerFn.includes('saat') || lowerFn.includes('phone') || lowerFn.includes('watch') || lowerFn.includes('laptop') || lowerFn.includes('tech') || lowerFn.includes('aksesuar')) {
    return 'tech';
  } else if (lowerFn.includes('yemek') || lowerFn.includes('oil') || lowerFn.includes('ekmek') || lowerFn.includes('coffee') || lowerFn.includes('food') || lowerFn.includes('tea') || lowerFn.includes('icecek')) {
    return 'food';
  } else if (lowerFn.includes('doga') || lowerFn.includes('sunset') || lowerFn.includes('forest') || lowerFn.includes('landscape') || lowerFn.includes('manzara') || lowerFn.includes('mountain')) {
    return 'landscape';
  } else if (lowerFn.includes('elbise') || lowerFn.includes('ceket') || lowerFn.includes('giyim') || lowerFn.includes('fashion') || lowerFn.includes('tisort') || lowerFn.includes('kombin')) {
    return 'fashion';
  } else if (lowerFn.includes('spor') || lowerFn.includes('yoga') || lowerFn.includes('fitness') || lowerFn.includes('mat') || lowerFn.includes('kosu') || lowerFn.includes('dambil')) {
    return 'fitness';
  } else if (lowerFn.includes('ofis') || lowerFn.includes('toplanti') || lowerFn.includes('is') || lowerFn.includes('sirket') || lowerFn.includes('grafik') || lowerFn.includes('business')) {
    return 'business';
  } else if (lowerFn.includes('mimari') || lowerFn.includes('bina') || lowerFn.includes('ev') || lowerFn.includes('loft') || lowerFn.includes('tasarim') || lowerFn.includes('architecture')) {
    return 'architecture';
  } else if (lowerFn.includes('kedi') || lowerFn.includes('kopek') || lowerFn.includes('pet') || lowerFn.includes('hayvan') || lowerFn.includes('animal') || lowerFn.includes('kus')) {
    return 'animals';
  } else if (lowerFn.includes('seyahat') || lowerFn.includes('gezi') || lowerFn.includes('harita') || lowerFn.includes('canta') || lowerFn.includes('travel') || lowerFn.includes('turist')) {
    return 'travel';
  } else if (lowerFn.includes('araba') || lowerFn.includes('motor') || lowerFn.includes('motosiklet') || lowerFn.includes('oto') || lowerFn.includes('car') || lowerFn.includes('hiz')) {
    return 'automotive';
  } else if (lowerFn.includes('insan') || lowerFn.includes('kadin') || lowerFn.includes('adam') || lowerFn.includes('aile') || lowerFn.includes('cocuk') || lowerFn.includes('portre') || lowerFn.includes('portrait')) {
    return 'portrait';
  }
  return 'other';
}

export async function generateGeminiMetadata(base64DataUrl, categoryKey, language = 'tr') {
  // Get JWT token from Supabase session
  const { supabase } = await import('./supabase.js');
  const { data: { session } } = await supabase.auth.getSession();

  const headers = {
    'Content-Type': 'application/json'
  };

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  // Call the secure backend proxy endpoint
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      base64DataUrl,
      categoryKey,
      language
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    let errMsg = "API Hatası oluştu.";
    try {
      const errJson = JSON.parse(errText);
      errMsg = errJson.error?.message || errMsg;
    } catch (e) {}
    const error = new Error(errMsg);
    error.status = response.status;
    throw error;
  }

  const result = await response.json();
  return result;
}

