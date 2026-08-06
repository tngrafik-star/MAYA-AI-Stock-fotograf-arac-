import { getCurrentLanguage, changeLanguage } from './i18n/index.js';

/**
 * Creates and injects a language switcher component (TR | EN pill toggle)
 * into the specified container element.
 * 
 * @param {string|HTMLElement} container - CSS selector string or DOM element to inject into
 * @param {string} position - 'prepend' to insert at beginning, 'append' to insert at end, 'before' to insert before container
 */
export function createLanguageSwitcher(container, position = 'prepend') {
  const targetEl = typeof container === 'string' ? document.querySelector(container) : container;
  if (!targetEl) return;

  // Statik olarak HTML'de render edilmiş bir switcher varsa yenisini üretme —
  // mevcut olanı hydrate et. Aksi halde DOM'a ikinci bir switcher eklenir.
  const existing = targetEl.querySelector(':scope > .lang-switcher');
  if (existing) {
    return hydrateLanguageSwitcher(existing);
  }

  const switcher = document.createElement('div');
  switcher.className = 'lang-switcher';
  switcher.setAttribute('role', 'radiogroup');
  switcher.setAttribute('aria-label', 'Language selection');

  const btnTR = document.createElement('button');
  btnTR.className = 'lang-btn';
  btnTR.textContent = 'TR';
  btnTR.setAttribute('data-lang', 'tr');
  btnTR.setAttribute('role', 'radio');
  btnTR.setAttribute('aria-label', 'Türkçe');

  const btnEN = document.createElement('button');
  btnEN.className = 'lang-btn';
  btnEN.textContent = 'EN';
  btnEN.setAttribute('data-lang', 'en');
  btnEN.setAttribute('role', 'radio');
  btnEN.setAttribute('aria-label', 'English');

  switcher.appendChild(btnTR);
  switcher.appendChild(btnEN);

  // Set initial active state
  updateActiveState(switcher);

  // Click handlers
  btnTR.addEventListener('click', () => {
    if (getCurrentLanguage() !== 'tr') {
      changeLanguage('tr');
      updateAllSwitchers();
    }
  });

  btnEN.addEventListener('click', () => {
    if (getCurrentLanguage() !== 'en') {
      changeLanguage('en');
      updateAllSwitchers();
    }
  });

  // Insert into DOM
  if (position === 'prepend') {
    targetEl.prepend(switcher);
  } else if (position === 'before') {
    targetEl.parentNode.insertBefore(switcher, targetEl);
  } else {
    targetEl.appendChild(switcher);
  }

  return switcher;
}

/**
 * Attach behaviour to a language switcher that already exists in the DOM
 * (server-rendered / static markup). Idempotent — safe to call more than once.
 *
 * @param {HTMLElement} switcherEl - existing .lang-switcher element
 */
export function hydrateLanguageSwitcher(switcherEl) {
  if (!switcherEl || switcherEl.dataset.hydrated === 'true') return switcherEl;
  switcherEl.dataset.hydrated = 'true';

  switcherEl.querySelectorAll('.lang-btn').forEach(btn => {
    const lang = btn.getAttribute('data-lang');
    if (!lang) return;
    btn.addEventListener('click', () => {
      if (getCurrentLanguage() !== lang) {
        changeLanguage(lang);
        updateAllSwitchers();
      }
    });
  });

  // Statik markup TR'yi aktif varsayar; gerçek dile göre düzelt
  updateActiveState(switcherEl);
  return switcherEl;
}

/**
 * Update the active state of a single switcher element
 */
function updateActiveState(switcherEl) {
  const currentLang = getCurrentLanguage();
  switcherEl.querySelectorAll('.lang-btn').forEach(btn => {
    const isActive = btn.getAttribute('data-lang') === currentLang;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-checked', isActive ? 'true' : 'false');
  });
}

/**
 * Update all language switchers on the page (for multi-switcher scenarios)
 */
function updateAllSwitchers() {
  document.querySelectorAll('.lang-switcher').forEach(sw => {
    updateActiveState(sw);
  });
}

// Listen for language changes from other sources (e.g., another switcher instance)
window.addEventListener('languageChanged', () => {
  updateAllSwitchers();
});
