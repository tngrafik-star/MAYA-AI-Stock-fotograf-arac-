import { describe, it, expect } from 'vitest';
import { embedXmpInJpeg, buildXmpPacket } from '../js/xmp.js';
import { safeRedirectPath } from '../js/redirect.js';

// SOI, APP0 (JFIF, 16 bytes), SOS with 2 bytes of "scan data", EOI
const tinyJpeg = () => new Uint8Array([
  0xFF, 0xD8,
  0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00,
  0xFF, 0xDA, 0x00, 0x02, 0xAB, 0xCD,
  0xFF, 0xD9
]);

const latin1 = (bytes) => Array.from(bytes, b => String.fromCharCode(b)).join('');
const countXmp = (bytes) => latin1(bytes).split('http://ns.adobe.com/xap/1.0/').length - 1;

describe('embedXmpInJpeg', () => {
  it('inserts one XMP segment after APP0 and keeps the image data', () => {
    const out = embedXmpInJpeg(tinyJpeg(), { title: 'Mug', description: 'A mug', keywords: 'mug, coffee' });
    expect(out[0]).toBe(0xFF);
    expect(out[1]).toBe(0xD8);
    expect(out[20]).toBe(0xFF);
    expect(out[21]).toBe(0xE1); // XMP right after the 18-byte APP0 segment
    expect(countXmp(out)).toBe(1);
    expect(Array.from(out.slice(-8))).toEqual([0xFF, 0xDA, 0x00, 0x02, 0xAB, 0xCD, 0xFF, 0xD9]);
  });

  it('replaces an existing XMP packet instead of adding a second one', () => {
    const once = embedXmpInJpeg(tinyJpeg(), { title: 'First', keywords: 'a' });
    const twice = embedXmpInJpeg(once, { title: 'Second', keywords: 'b' });
    expect(countXmp(twice)).toBe(1);
    const text = new TextDecoder().decode(twice);
    expect(text).toContain('Second');
    expect(text).not.toContain('First');
  });

  it('rejects files that are not JPEG', () => {
    expect(() => embedXmpInJpeg(new Uint8Array([0x89, 0x50, 0x4E, 0x47]), { title: 'x' })).toThrow('NOT_JPEG');
  });
});

describe('buildXmpPacket', () => {
  it('escapes XML and lists each keyword', () => {
    const xmp = buildXmpPacket({ title: 'Salt & <Pepper>', description: '"Quoted"', keywords: 'salt, pepper, , spice' });
    expect(xmp).toContain('Salt &amp; &lt;Pepper&gt;');
    expect(xmp).toContain('&quot;Quoted&quot;');
    expect(xmp.match(/<rdf:li>/g)).toHaveLength(3);
  });
});

describe('safeRedirectPath', () => {
  const origin = 'https://mayalisting.com';

  it('keeps same-origin paths', () => {
    expect(safeRedirectPath('/app/?tab=billing', origin)).toBe('/app/?tab=billing');
  });

  it('falls back for other sites and script URLs', () => {
    expect(safeRedirectPath('https://evil.example/login', origin)).toBe('/app/');
    expect(safeRedirectPath('//evil.example', origin)).toBe('/app/');
    expect(safeRedirectPath('javascript:alert(1)', origin)).toBe('/app/');
  });

  it('falls back when no redirect is given', () => {
    expect(safeRedirectPath(null, origin)).toBe('/app/');
  });
});
