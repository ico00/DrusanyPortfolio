/**
 * Provjera file signature (magic bytes) da se osigura da je datoteka stvarno slika.
 * MIME type s klijenta može biti lažiran – magic bytes ne mogu.
 */

function matchesAt(buffer: Buffer, bytes: number[], offset: number): boolean {
  if (offset + bytes.length > buffer.length) return false;
  for (let i = 0; i < bytes.length; i++) {
    if (buffer[offset + i] !== bytes[i]) return false;
  }
  return true;
}

/**
 * Provjerava da li buffer ima valjani image file signature.
 * Vraća true ako datoteka odgovara jednom od dozvoljenih formata (JPEG, PNG, GIF, WebP).
 */
export function hasValidImageSignature(buffer: Buffer): boolean {
  if (!buffer || buffer.length < 12) return false;

  // JPEG: FF D8 FF
  if (matchesAt(buffer, [0xff, 0xd8, 0xff], 0)) return true;

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    matchesAt(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0)
  )
    return true;

  // GIF87a ili GIF89a
  if (
    matchesAt(buffer, [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], 0) ||
    matchesAt(buffer, [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], 0)
  )
    return true;

  // WebP: RIFF na 0, WEBP na 8
  if (
    matchesAt(buffer, [0x52, 0x49, 0x46, 0x46], 0) &&
    matchesAt(buffer, [0x57, 0x45, 0x42, 0x50], 8)
  )
    return true;

  return false;
}
