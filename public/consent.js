// Cookie consent + Google Consent Mode v2.
// Loaded synchronously BEFORE the gtag.js snippet on every page, so Google
// Analytics and Ads start with storage denied until the visitor accepts.
(function () {
  var STORAGE_KEY = 'maya_cookie_consent'; // 'granted' | 'denied'

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }

  var DENIED = {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied'
  };
  var GRANTED = {
    ad_storage: 'granted',
    ad_user_data: 'granted',
    ad_personalization: 'granted',
    analytics_storage: 'granted'
  };

  function readChoice() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }

  function saveChoice(value) {
    try { localStorage.setItem(STORAGE_KEY, value); } catch (e) { /* private mode */ }
  }

  gtag('consent', 'default', Object.assign({ wait_for_update: 500 }, DENIED));
  gtag('set', 'ads_data_redaction', true);

  var stored = readChoice();
  if (stored === 'granted') {
    gtag('consent', 'update', GRANTED);
  }

  function isEnglish() {
    var lang = '';
    try { lang = localStorage.getItem('i18nextLng') || ''; } catch (e) { /* ignore */ }
    lang = lang || document.documentElement.lang || navigator.language || 'tr';
    return lang.toLowerCase().indexOf('en') === 0;
  }

  var TEXT = {
    tr: {
      body: 'Siteyi geliştirmek ve reklamlarımızın etkisini ölçmek için Google Analytics ve Google Ads çerezlerini kullanmak istiyoruz. Oturum ve tercih çerezleri her zaman açıktır. Ayrıntılar: ',
      link: 'Gizlilik Politikası',
      accept: 'Kabul et',
      reject: 'Reddet'
    },
    en: {
      body: 'We would like to use Google Analytics and Google Ads cookies to improve the site and measure our ads. Session and preference cookies are always on. Details: ',
      link: 'Privacy Policy',
      accept: 'Accept',
      reject: 'Decline'
    }
  };

  function choose(value) {
    saveChoice(value);
    gtag('consent', 'update', value === 'granted' ? GRANTED : DENIED);
    var banner = document.getElementById('maya-consent-banner');
    if (banner) banner.remove();
  }

  function showBanner() {
    if (document.getElementById('maya-consent-banner')) return;
    var text = isEnglish() ? TEXT.en : TEXT.tr;

    var style = document.createElement('style');
    style.textContent =
      '#maya-consent-banner{--mc-bg:#ffffff;--mc-fg:#1b1f27;--mc-muted:#5d6573;--mc-line:#d9dde4;--mc-accent:#1b1f27;--mc-on-accent:#ffffff;' +
      'position:fixed;z-index:2147483000;left:16px;right:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px));max-width:560px;margin:0 auto;' +
      'background:var(--mc-bg);color:var(--mc-fg);border:1px solid var(--mc-line);border-radius:10px;box-shadow:0 8px 30px rgba(0,0,0,.18);' +
      'padding:16px;font:14px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;display:flex;flex-direction:column;gap:12px}' +
      '@media (prefers-color-scheme:dark){#maya-consent-banner{--mc-bg:#1a1d24;--mc-fg:#e8eaef;--mc-muted:#9aa2b1;--mc-line:#2e333e;--mc-accent:#e8eaef;--mc-on-accent:#111318}}' +
      '#maya-consent-banner p{margin:0;color:var(--mc-fg)}#maya-consent-banner a{color:inherit;text-decoration:underline}' +
      '#maya-consent-banner .mc-actions{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap}' +
      '#maya-consent-banner button{font:inherit;font-weight:600;border-radius:6px;padding:8px 16px;cursor:pointer;border:1px solid var(--mc-accent)}' +
      '#maya-consent-banner .mc-reject{background:transparent;color:var(--mc-fg);border-color:var(--mc-line)}' +
      '#maya-consent-banner .mc-accept{background:var(--mc-accent);color:var(--mc-on-accent)}' +
      '#maya-consent-banner button:focus-visible{outline:2px solid var(--mc-muted);outline-offset:2px}';
    document.head.appendChild(style);

    var banner = document.createElement('div');
    banner.id = 'maya-consent-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-live', 'polite');
    banner.setAttribute('aria-label', isEnglish() ? 'Cookie preferences' : 'Çerez tercihleri');

    var p = document.createElement('p');
    p.appendChild(document.createTextNode(text.body));
    var a = document.createElement('a');
    a.href = '/legal/gizlilik/';
    a.textContent = text.link;
    p.appendChild(a);

    var actions = document.createElement('div');
    actions.className = 'mc-actions';
    var reject = document.createElement('button');
    reject.type = 'button';
    reject.className = 'mc-reject';
    reject.textContent = text.reject;
    reject.addEventListener('click', function () { choose('denied'); });
    var accept = document.createElement('button');
    accept.type = 'button';
    accept.className = 'mc-accept';
    accept.textContent = text.accept;
    accept.addEventListener('click', function () { choose('granted'); });
    actions.appendChild(reject);
    actions.appendChild(accept);

    banner.appendChild(p);
    banner.appendChild(actions);
    document.body.appendChild(banner);
  }

  // Lets a footer link reopen the choice ("Çerez Tercihleri")
  window.mayaConsent = { open: showBanner };
  document.addEventListener('click', function (e) {
    var target = e.target && e.target.closest ? e.target.closest('[data-cookie-settings]') : null;
    if (target) {
      e.preventDefault();
      showBanner();
    }
  });

  if (stored !== 'granted' && stored !== 'denied') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', showBanner);
    } else {
      showBanner();
    }
  }
})();
