import { describe, it, expect } from 'vitest';
import { checkListing, cleanKeywords, splitKeywords, findDuplicates } from '../js/tools/metadata-rules.js';

const codes = (findings, level) => findings.filter(f => !level || f.level === level).map(f => f.code);
const many = (n, prefix = 'kw') => Array.from({ length: n }, (_, i) => `${prefix}${i}`).join(', ');

describe('splitKeywords / findDuplicates', () => {
  it('splits on commas, semicolons and new lines and trims', () => {
    expect(splitKeywords(' mug,  coffee ;tea\nhot   drink, ')).toEqual(['mug', 'coffee', 'tea', 'hot drink']);
  });

  it('finds case-insensitive duplicates once', () => {
    expect(findDuplicates(['Mug', 'coffee', 'mug', 'MUG', 'tea'])).toEqual(['Mug']);
  });
});

describe('checkListing', () => {
  it('passes a good Adobe Stock listing', () => {
    const findings = checkListing('adobe', 'Ceramic coffee mug on a wooden table', many(30));
    expect(codes(findings, 'error')).toEqual([]);
    expect(codes(findings, 'warn')).toEqual([]);
  });

  it('flags too many Adobe keywords and duplicates', () => {
    const findings = checkListing('adobe', 'Mug', `${many(50)}, kw1`);
    expect(codes(findings, 'error')).toEqual(expect.arrayContaining(['keywordsTooMany', 'keywordsDuplicate']));
  });

  it('warns about Turkish text on stock platforms', () => {
    const findings = checkListing('shutterstock', 'Ahşap masada kahve fincanı ve kurabiye', many(10));
    expect(codes(findings, 'warn')).toContain('notEnglish');
  });

  it('requires exactly 13 Etsy tags of at most 20 characters', () => {
    const tooFew = checkListing('etsy', 'Handmade mug', many(5));
    expect(codes(tooFew, 'error')).toContain('keywordsTooFew');

    const longTag = checkListing('etsy', 'Handmade mug', `${many(12)}, handmade ceramic coffee mug gift`);
    expect(codes(longTag, 'error')).toContain('tagsTooLong');
  });

  it('rejects Etsy tags with disallowed characters', () => {
    const findings = checkListing('etsy', 'Handmade mug', `${many(12)}, mug & cup`);
    expect(codes(findings, 'error')).toContain('tagsBadChars');
  });

  it('flags a title over the platform maximum', () => {
    const findings = checkListing('etsy', 'x'.repeat(141), many(13));
    expect(codes(findings, 'error')).toContain('titleTooLong');
  });
});

describe('cleanKeywords', () => {
  it('lowercases, de-duplicates and cuts to the maximum', () => {
    expect(cleanKeywords('adobe', 'Mug, mug, Coffee')).toEqual(['mug', 'coffee']);
    expect(cleanKeywords('adobe', many(60))).toHaveLength(49);
  });

  it('drops Etsy tags that are too long', () => {
    expect(cleanKeywords('etsy', 'mug, handmade ceramic coffee mug gift')).toEqual(['mug']);
  });
});
