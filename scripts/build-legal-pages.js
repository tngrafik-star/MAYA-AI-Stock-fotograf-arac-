// Builds standalone, crawlable legal pages from the i18n legal texts so that
// payment providers, ad reviewers and search engines can reach them by URL.
// Output goes to public/legal/ (copied as-is into dist/ by Vite).
//
//   node scripts/build-legal-pages.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'public', 'legal');

const PAGES = [
  { key: 'privacy', tr: 'gizlilik', en: 'privacy' },
  { key: 'terms', tr: 'kullanim-kosullari', en: 'terms' },
  { key: 'kvkk', tr: 'kvkk', en: 'kvkk' }
];

const urlFor = (lang, page) => (lang === 'tr' ? `/legal/${page.tr}/` : `/legal/en/${page.en}/`);

function render(lang, page, legal, footerLabels) {
  const other = lang === 'tr' ? 'en' : 'tr';
  const title = legal[`${page.key}Title`];
  const nav = PAGES.map(p => {
    const label = footerLabels[p.key];
    return p.key === page.key
      ? `<span aria-current="page">${label}</span>`
      : `<a href="${urlFor(lang, p)}">${label}</a>`;
  }).join(' · ');

  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} | MayaListing</title>
<link rel="canonical" href="https://mayalisting.com${urlFor(lang, page)}">
<link rel="alternate" hreflang="tr" href="https://mayalisting.com${urlFor('tr', page)}">
<link rel="alternate" hreflang="en" href="https://mayalisting.com${urlFor('en', page)}">
<link rel="icon" href="/favicon.ico">
<style>
:root { --bg: #ffffff; --fg: #1b1f27; --muted: #5d6573; --line: #d9dde4; --accent: #2d4ec4; }
@media (prefers-color-scheme: dark) { :root { --bg: #111318; --fg: #e8eaef; --muted: #9aa2b1; --line: #2e333e; --accent: #8ea6ff; color-scheme: dark; } }
body { margin: 0; background: var(--bg); color: var(--fg); font: 16px/1.65 system-ui, -apple-system, "Segoe UI", sans-serif;
  padding: 32px max(16px, env(safe-area-inset-right, 0px)) 64px max(16px, env(safe-area-inset-left, 0px)); }
main { max-width: 720px; margin: 0 auto; }
header { display: flex; justify-content: space-between; align-items: baseline; gap: 16px; flex-wrap: wrap; border-bottom: 1px solid var(--line); padding-bottom: 16px; margin-bottom: 24px; }
a { color: var(--accent); }
.brand { font-weight: 700; text-decoration: none; color: var(--fg); }
h1 { font-size: 28px; line-height: 1.25; margin: 0 0 4px; text-wrap: balance; }
h4 { font-size: 18px; margin: 28px 0 8px; }
.updated, nav { color: var(--muted); font-size: 14px; }
nav { margin-top: 40px; border-top: 1px solid var(--line); padding-top: 16px; }
</style>
</head>
<body>
<main>
<header>
<a class="brand" href="/">MayaListing</a>
<a href="${urlFor(other, page)}" hreflang="${other}">${other === 'en' ? 'English' : 'Türkçe'}</a>
</header>
<h1>${title}</h1>
<p class="updated">${legal.lastUpdate}</p>
${legal[`${page.key}Content`]}
<nav>${nav}</nav>
</main>
</body>
</html>
`;
}

for (const lang of ['tr', 'en']) {
  const dict = JSON.parse(fs.readFileSync(path.join(root, 'js', 'i18n', `${lang}.json`), 'utf8'));
  const footerLabels = { privacy: dict.footer.privacy, terms: dict.footer.terms, kvkk: dict.footer.kvkk };
  for (const page of PAGES) {
    const dir = path.join(outDir, lang === 'tr' ? page.tr : path.join('en', page.en));
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), render(lang, page, dict.legal, footerLabels));
  }
}

console.log('✅ Legal pages written to public/legal/');
