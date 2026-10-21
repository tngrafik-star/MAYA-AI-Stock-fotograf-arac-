// Embeds title, description and keywords into a JPEG as an XMP packet.
// Adobe Stock, Shutterstock and Freepik read dc:title, dc:description and
// dc:subject on upload, so the metadata arrives with the file itself.

const XMP_NAMESPACE = 'http://ns.adobe.com/xap/1.0/\0';
const MAX_SEGMENT_PAYLOAD = 65533; // 0xFFFF minus the 2-byte length field

const escapeXml = (str) => String(str || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

export function buildXmpPacket({ title, description, keywords }) {
  const keywordList = String(keywords || '')
    .split(',')
    .map(k => k.trim())
    .filter(Boolean);

  const subjects = keywordList.map(k => `<rdf:li>${escapeXml(k)}</rdf:li>`).join('');

  return `<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
<rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/">
<dc:title><rdf:Alt><rdf:li xml:lang="x-default">${escapeXml(title)}</rdf:li></rdf:Alt></dc:title>
<dc:description><rdf:Alt><rdf:li xml:lang="x-default">${escapeXml(description)}</rdf:li></rdf:Alt></dc:description>
<dc:subject><rdf:Bag>${subjects}</rdf:Bag></dc:subject>
<photoshop:Headline>${escapeXml(title)}</photoshop:Headline>
</rdf:Description>
</rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
}

const isXmpSegment = (bytes, offset, length) => {
  if (length < XMP_NAMESPACE.length) return false;
  for (let i = 0; i < XMP_NAMESPACE.length; i++) {
    if (bytes[offset + i] !== XMP_NAMESPACE.charCodeAt(i)) return false;
  }
  return true;
};

/**
 * Returns a new JPEG (Uint8Array) carrying the XMP metadata. Any existing XMP
 * segment is replaced; image data and other metadata (EXIF, ICC) are kept.
 * Throws for files that are not JPEG.
 */
export function embedXmpInJpeg(jpegBytes, metadata) {
  const bytes = jpegBytes instanceof Uint8Array ? jpegBytes : new Uint8Array(jpegBytes);
  if (bytes[0] !== 0xFF || bytes[1] !== 0xD8) {
    throw new Error('NOT_JPEG');
  }

  const payload = new TextEncoder().encode(XMP_NAMESPACE + buildXmpPacket(metadata));
  if (payload.length > MAX_SEGMENT_PAYLOAD) {
    throw new Error('XMP_TOO_LARGE');
  }

  const segment = new Uint8Array(4 + payload.length);
  segment[0] = 0xFF;
  segment[1] = 0xE1;
  segment[2] = ((payload.length + 2) >> 8) & 0xFF;
  segment[3] = (payload.length + 2) & 0xFF;
  segment.set(payload, 4);

  // Walk the header segments: keep everything except old XMP, and insert the
  // new packet after APP0 (JFIF) / existing APP1 (EXIF), before image data
  const kept = [];
  let insertAt = 0;
  let offset = 2;
  while (offset + 4 <= bytes.length && bytes[offset] === 0xFF) {
    const marker = bytes[offset + 1];
    if (marker === 0xDA || marker === 0xD9) break; // start of scan / end of image
    const length = (bytes[offset + 2] << 8) | bytes[offset + 3];
    const end = offset + 2 + length;
    if (end > bytes.length) break;

    const xmp = marker === 0xE1 && isXmpSegment(bytes, offset + 4, length - 2);
    if (!xmp) {
      kept.push(bytes.subarray(offset, end));
      if (marker === 0xE0 || marker === 0xE1) insertAt = kept.length;
    }
    offset = end;
  }

  kept.splice(insertAt, 0, segment);
  const rest = bytes.subarray(offset);
  const total = 2 + kept.reduce((sum, part) => sum + part.length, 0) + rest.length;

  const out = new Uint8Array(total);
  out[0] = 0xFF;
  out[1] = 0xD8;
  let pos = 2;
  kept.forEach(part => { out.set(part, pos); pos += part.length; });
  out.set(rest, pos);
  return out;
}
