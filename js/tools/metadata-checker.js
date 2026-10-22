import { PLATFORMS, checkListing, cleanKeywords, splitKeywords } from './metadata-rules.js';

const LANG = document.documentElement.lang === 'en' ? 'en' : 'tr';

const TEXT = {
  tr: {
    titleMissing: 'Başlık boş.',
    titleTooLong: 'Başlık {length} karakter; en fazla {max} olabilir.',
    titleLongerThanIdeal: 'Başlık {length} karakter. Arama sonuçlarında görünmesi için {ideal} karakterin altında tutun.',
    titleLength: 'Başlık uzunluğu uygun ({length} / {max}).',
    titleFewWords: 'Açıklama {words} kelime; en az {min} kelime önerilir.',
    keywordsMissing: 'Anahtar kelime yok.',
    keywordsTooMany: '{count} anahtar kelime var; en fazla {max} kabul edilir, fazlası kesilir.',
    keywordsTooFew: '{count} anahtar kelime var; en az {min} gerekli.',
    keywordsBelowIdeal: '{count} anahtar kelime var. Bulunabilirlik için en az {ideal} önerilir.',
    keywordsCount: 'Anahtar kelime sayısı uygun ({count} / {max}).',
    keywordsDuplicate: 'Tekrarlanan kelimeler: {list}',
    tagsTooLong: '{max} karakteri aşan etiketler: {list}',
    tagsBadChars: 'İzin verilmeyen karakter içeren etiketler: {list}',
    notEnglish: 'Stok siteleri İngilizce metadata ister. Türkçe karakter içerenler: {list}',
    cleaned: 'Temizlenmiş liste panoya kopyalandı ({count} kelime).',
    copyFailed: 'Kopyalanamadı; aşağıdaki listeyi elle seçip kopyalayın.'
  },
  en: {
    titleMissing: 'The title is empty.',
    titleTooLong: 'The title is {length} characters; the maximum is {max}.',
    titleLongerThanIdeal: 'The title is {length} characters. Keep it under {ideal} so it shows in full in search results.',
    titleLength: 'Title length is fine ({length} / {max}).',
    titleFewWords: 'The description has {words} words; at least {min} is recommended.',
    keywordsMissing: 'No keywords yet.',
    keywordsTooMany: '{count} keywords; only {max} are accepted and the rest are cut.',
    keywordsTooFew: '{count} keywords; at least {min} are required.',
    keywordsBelowIdeal: '{count} keywords. Use at least {ideal} to be found more often.',
    keywordsCount: 'Keyword count is fine ({count} / {max}).',
    keywordsDuplicate: 'Repeated keywords: {list}',
    tagsTooLong: 'Tags longer than {max} characters: {list}',
    tagsBadChars: 'Tags with characters Etsy does not allow: {list}',
    notEnglish: 'Stock sites expect English metadata. Entries with Turkish characters: {list}',
    cleaned: 'Cleaned list copied to the clipboard ({count} keywords).',
    copyFailed: 'Could not copy; select the list below and copy it yourself.'
  }
}[LANG];

const fill = (template, params) => template.replace(/\{(\w+)\}/g, (_, key) => params[key] ?? '');

const form = document.getElementById('checker-form');
const titleInput = document.getElementById('checker-title');
const keywordsInput = document.getElementById('checker-keywords');
const results = document.getElementById('checker-results');
const titleCount = document.getElementById('checker-title-count');
const keywordCount = document.getElementById('checker-keyword-count');
const cleanBtn = document.getElementById('checker-clean');
const cleanOutput = document.getElementById('checker-clean-output');
const platformButtons = document.querySelectorAll('[data-platform]');

let platform = 'adobe';

function render() {
  const rules = PLATFORMS[platform];
  const title = titleInput.value;
  const keywords = splitKeywords(keywordsInput.value);

  titleCount.textContent = `${title.trim().length} / ${rules.titleMax}`;
  keywordCount.textContent = `${keywords.length} / ${rules.keywordsMax}`;

  results.textContent = '';
  if (!title.trim() && keywords.length === 0) return;

  checkListing(platform, title, keywordsInput.value).forEach(finding => {
    const li = document.createElement('li');
    li.className = `finding finding-${finding.level}`;
    const badge = document.createElement('span');
    badge.className = 'finding-badge';
    badge.textContent = finding.level === 'ok' ? '✓' : finding.level === 'warn' ? '!' : '×';
    badge.setAttribute('aria-hidden', 'true');
    const text = document.createElement('span');
    text.textContent = fill(TEXT[finding.code], finding.params);
    li.append(badge, text);
    results.appendChild(li);
  });
}

platformButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    platform = btn.dataset.platform;
    platformButtons.forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
    document.getElementById('checker-title-label').textContent = btn.dataset.titleLabel;
    cleanOutput.hidden = true;
    render();
  });
});

titleInput.addEventListener('input', render);
keywordsInput.addEventListener('input', render);
form.addEventListener('submit', (e) => e.preventDefault());

cleanBtn.addEventListener('click', async () => {
  const cleaned = cleanKeywords(platform, keywordsInput.value).join(', ');
  cleanOutput.textContent = cleaned;
  cleanOutput.hidden = false;
  try {
    await navigator.clipboard.writeText(cleaned);
    cleanOutput.dataset.note = fill(TEXT.cleaned, { count: cleaned ? cleaned.split(', ').length : 0 });
  } catch (err) {
    cleanOutput.dataset.note = TEXT.copyFailed;
  }
  document.getElementById('checker-clean-note').textContent = cleanOutput.dataset.note;
});

render();
