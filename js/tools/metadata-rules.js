// Listing rules for the free metadata checker. Pure functions, no DOM.
// Limits follow each platform's contributor/seller guidelines.

export const PLATFORMS = {
  adobe: {
    name: 'Adobe Stock',
    titleMax: 200,
    titleIdeal: 70,
    keywordsMin: 5,
    keywordsMax: 49,
    keywordsIdealMin: 25,
    englishOnly: true
  },
  shutterstock: {
    name: 'Shutterstock',
    titleMax: 200,
    titleIdeal: 200,
    titleMinWords: 5,
    keywordsMin: 7,
    keywordsMax: 50,
    keywordsIdealMin: 25,
    englishOnly: true
  },
  etsy: {
    name: 'Etsy',
    titleMax: 140,
    titleIdeal: 140,
    keywordsMin: 13,
    keywordsMax: 13,
    keywordsIdealMin: 13,
    tagMaxLength: 20,
    tagPattern: /^[\p{L}\p{N} '\-™©®]+$/u
  }
};

const TURKISH_CHARS = /[çğıöşüÇĞİÖŞÜ]/;

export function splitKeywords(text) {
  return String(text || '')
    .split(/[,;\n]/)
    .map(k => k.trim().replace(/\s+/g, ' '))
    .filter(Boolean);
}

/** Case-insensitive duplicates, each reported once in its first spelling. */
export function findDuplicates(keywords) {
  const seen = new Map();
  const dupes = [];
  keywords.forEach(k => {
    const key = k.toLocaleLowerCase('en');
    if (seen.has(key) && !dupes.includes(seen.get(key))) dupes.push(seen.get(key));
    if (!seen.has(key)) seen.set(key, k);
  });
  return dupes;
}

/**
 * Returns a list of findings: { level: 'ok' | 'warn' | 'error', code, params }.
 * `code` is translated by the page; params fill its placeholders.
 */
export function checkListing(platformKey, title, keywordText) {
  const rules = PLATFORMS[platformKey];
  const findings = [];
  const add = (level, code, params = {}) => findings.push({ level, code, params });

  const cleanTitle = String(title || '').trim();
  const keywords = splitKeywords(keywordText);

  // Title
  if (!cleanTitle) {
    add('error', 'titleMissing');
  } else if (cleanTitle.length > rules.titleMax) {
    add('error', 'titleTooLong', { length: cleanTitle.length, max: rules.titleMax });
  } else if (cleanTitle.length > rules.titleIdeal) {
    add('warn', 'titleLongerThanIdeal', { length: cleanTitle.length, ideal: rules.titleIdeal });
  } else {
    add('ok', 'titleLength', { length: cleanTitle.length, max: rules.titleMax });
  }

  if (cleanTitle && rules.titleMinWords) {
    const words = cleanTitle.split(/\s+/).length;
    if (words < rules.titleMinWords) add('warn', 'titleFewWords', { words, min: rules.titleMinWords });
  }

  // Keyword count
  const count = keywords.length;
  if (count === 0) {
    add('error', 'keywordsMissing');
  } else if (count > rules.keywordsMax) {
    add('error', 'keywordsTooMany', { count, max: rules.keywordsMax });
  } else if (count < rules.keywordsMin) {
    add('error', 'keywordsTooFew', { count, min: rules.keywordsMin });
  } else if (count < rules.keywordsIdealMin) {
    add('warn', 'keywordsBelowIdeal', { count, ideal: rules.keywordsIdealMin });
  } else {
    add('ok', 'keywordsCount', { count, max: rules.keywordsMax });
  }

  const dupes = findDuplicates(keywords);
  if (dupes.length) add('error', 'keywordsDuplicate', { list: dupes.join(', ') });

  if (rules.tagMaxLength) {
    const long = keywords.filter(k => k.length > rules.tagMaxLength);
    if (long.length) add('error', 'tagsTooLong', { max: rules.tagMaxLength, list: long.join(', ') });
  }

  if (rules.tagPattern) {
    const bad = keywords.filter(k => !rules.tagPattern.test(k));
    if (bad.length) add('error', 'tagsBadChars', { list: bad.join(', ') });
  }

  if (rules.englishOnly) {
    const nonEnglish = [cleanTitle, ...keywords].filter(text => TURKISH_CHARS.test(text));
    if (nonEnglish.length) add('warn', 'notEnglish', { list: nonEnglish.slice(0, 5).join(', ') });
  }

  return findings;
}

/** Trimmed, de-duplicated, lowercased keywords cut to the platform maximum. */
export function cleanKeywords(platformKey, keywordText) {
  const rules = PLATFORMS[platformKey];
  const seen = new Set();
  const out = [];
  splitKeywords(keywordText).forEach(k => {
    const lower = k.toLocaleLowerCase('en');
    if (seen.has(lower)) return;
    if (rules.tagMaxLength && lower.length > rules.tagMaxLength) return;
    seen.add(lower);
    out.push(lower);
  });
  return out.slice(0, rules.keywordsMax);
}
