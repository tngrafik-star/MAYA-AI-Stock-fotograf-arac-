import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import trTranslations from './tr.json';
import enTranslations from './en.json';

// Initialize i18next
i18next
  .use(LanguageDetector)
  .init({
    resources: {
      tr: { translation: trTranslations },
      en: { translation: enTranslations }
    },
    fallbackLng: 'tr',
    supportedLngs: ['tr', 'en'],
    nonExplicitSupportedLngs: false,
    debug: false,
    interpolation: {
      escapeValue: false // Not needed for vanilla JS (no XSS risk from framework rendering)
    },
    detection: {
      order: ['querystring', 'localStorage', 'navigator'],
      lookupQuerystring: 'lang',
      lookupLocalStorage: 'maya-language',
      caches: ['localStorage']
    },
    returnNull: false,
    returnEmptyString: false,
    parseMissingKeyHandler: (key) => {
      // Never show raw keys to the user — return Turkish fallback text or key basename
      console.warn(`[i18n] Missing translation key: ${key}`);
      return key.split('.').pop() || key;
    }
  });

/**
 * Shorthand for i18next.t() — translate a key
 */
export const t = (key, options) => i18next.t(key, options);

/**
 * Get current language code
 */
export const getCurrentLanguage = () => i18next.language?.substring(0, 2) || 'tr';

/**
 * Change the active language and apply all DOM translations
 */
export function changeLanguage(lng) {
  i18next.changeLanguage(lng, (err) => {
    if (err) {
      console.error('[i18n] Language change error:', err);
      return;
    }
    applyTranslations();
    updateSEOMeta();
    updateHtmlLang();
    
    // Dispatch custom event for JS modules to react to language changes
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lng } }));
  });
}

/**
 * Apply translations to all DOM elements with data-i18n attributes
 * Supports:
 *   data-i18n="key"              → sets textContent
 *   data-i18n-html="key"         → sets innerHTML (for keys containing HTML)
 *   data-i18n-placeholder="key"  → sets placeholder attribute
 *   data-i18n-title="key"        → sets title attribute
 *   data-i18n-alt="key"          → sets alt attribute
 *   data-i18n-aria="key"         → sets aria-label attribute
 */
export function applyTranslations() {
  // textContent translations
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key) {
      let options = {};
      const optionsAttr = el.getAttribute('data-i18n-options');
      if (optionsAttr) {
        try {
          options = JSON.parse(optionsAttr);
        } catch (e) {
          console.warn(`[i18n] Failed to parse options for key: ${key}`, e);
        }
      }
      const translated = i18next.t(key, options);
      if (translated && translated !== key) {
        el.textContent = translated;
      }
    }
  });

  // innerHTML translations (for keys with embedded HTML like <br>, <strong>)
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.getAttribute('data-i18n-html');
    if (key) {
      let options = {};
      const optionsAttr = el.getAttribute('data-i18n-options');
      if (optionsAttr) {
        try {
          options = JSON.parse(optionsAttr);
        } catch (e) {
          console.warn(`[i18n] Failed to parse options for key: ${key}`, e);
        }
      }
      const translated = i18next.t(key, options);
      if (translated && translated !== key) {
        el.innerHTML = translated;
      }
    }
  });

  // Placeholder translations
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (key) {
      const translated = i18next.t(key);
      if (translated && translated !== key) {
        el.placeholder = translated;
      }
    }
  });

  // Title attribute translations
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    if (key) {
      const translated = i18next.t(key);
      if (translated && translated !== key) {
        el.title = translated;
      }
    }
  });

  // Alt attribute translations
  document.querySelectorAll('[data-i18n-alt]').forEach(el => {
    const key = el.getAttribute('data-i18n-alt');
    if (key) {
      const translated = i18next.t(key);
      if (translated && translated !== key) {
        el.alt = translated;
      }
    }
  });

  // ARIA label translations
  document.querySelectorAll('[data-i18n-aria]').forEach(el => {
    const key = el.getAttribute('data-i18n-aria');
    if (key) {
      const translated = i18next.t(key);
      if (translated && translated !== key) {
        el.setAttribute('aria-label', translated);
      }
    }
  });
}

/**
 * Update SEO meta tags based on current language
 */
export function updateSEOMeta() {
  const page = detectCurrentPage();

  if (page === 'landing') {
    setMetaContent('title', t('seo.landingTitle'));
    document.title = t('seo.landingTitle');
    setMetaContent('meta[name="title"]', t('seo.landingMetaTitle'));
    setMetaContent('meta[name="description"]', t('seo.landingDescription'));
    setMetaContent('meta[name="keywords"]', t('seo.landingKeywords'));
    setMetaContent('meta[property="og:title"]', t('seo.ogTitle'));
    setMetaContent('meta[property="og:description"]', t('seo.ogDescription'));
    setMetaContent('meta[property="twitter:title"]', t('seo.ogTitle'));
    setMetaContent('meta[property="twitter:description"]', t('seo.ogDescription'));
  } else if (page === 'dashboard') {
    document.title = t('seo.dashboardTitle');
  } else if (page === 'callback') {
    document.title = t('seo.callbackTitle');
  }
}

/**
 * Update the <html lang=""> attribute
 */
export function updateHtmlLang() {
  document.documentElement.lang = getCurrentLanguage();
}

/**
 * Get the current date locale string based on language
 */
export function getDateLocale() {
  return getCurrentLanguage() === 'en' ? 'en-US' : 'tr-TR';
}

// ---- Internal Helpers ----

function setMetaContent(selector, value) {
  // Handle <title> tag separately
  if (selector === 'title') {
    document.title = value;
    return;
  }
  const el = document.querySelector(selector);
  if (el) el.setAttribute('content', value);
}

function detectCurrentPage() {
  const path = window.location.pathname;
  if (path.includes('/app')) return 'dashboard';
  if (path.includes('/auth/callback')) return 'callback';
  return 'landing';
}

/**
 * Dynamically translate a database-stored activity log string based on the current language
 */
export function translateActivityLog(action) {
  if (!action) return '';
  
  // 1. Account Created
  if (action === 'Hesap Oluşturuldu ve Giriş Yapıldı' || action === 'Account Created and Signed In') {
    return t('activity.accountCreated');
  }
  
  // 2. Logged In
  if (action === 'Giriş Yapıldı' || action === 'Signed In') {
    return t('activity.loggedIn');
  }
  
  // 3. Logged Out
  if (action === 'Çıkış Yapıldı' || action === 'Signed Out') {
    return t('activity.loggedOut');
  }
  
  // 4. Profile Updated
  if (action === 'Profil Bilgileri Güncellendi' || action === 'Profile Updated') {
    return t('activity.profileUpdated');
  }
  
  // 5. Subscription Updated
  if (action.startsWith('Abonelik Güncellendi: ') || action.startsWith('Subscription Updated: ')) {
    const plan = action.split(': ')[1] || '';
    return t('activity.subscriptionUpdated', { plan: plan });
  }
  
  // 6. Metadata Created
  if (action.startsWith('Metadata Oluşturuldu: ') || action.startsWith('Metadata Generated: ')) {
    let title = action.replace('Metadata Oluşturuldu: ', '').replace('Metadata Generated: ', '');
    // Clean trailing ... if present
    if (title.endsWith('...')) {
      title = title.substring(0, title.length - 3);
    }
    return t('activity.metadataCreated', { title: title });
  }
  
  return action;
}

// Export i18next instance for advanced usage
export default i18next;
