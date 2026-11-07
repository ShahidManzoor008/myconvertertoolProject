// UTF-8 text and byte-preserving binary Base64 conversions.
export function encodeBytes(bytes, urlSafe = false) {
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 8192) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
  }
  const encoded = btoa(binary);
  return urlSafe ? encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') : encoded;
}
export function decodeBytes(value, urlSafe = false) {
  const normalized = value.replace(/\s/g, '');
  const input = urlSafe ? normalized.replace(/-/g, '+').replace(/_/g, '/') : normalized;
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(input) || input.length % 4 === 1 || (input.includes('=') && input.length % 4 !== 0)) {
    throw new Error('Invalid Base64 input.');
  }
  const binary = atob(input);
  const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
  if (encodeBytes(bytes).replace(/=+$/, '') !== input.replace(/=+$/, '')) throw new Error('Invalid Base64 padding bits.');
  return bytes;
}
export const encodeText = (text, urlSafe = false) => encodeBytes(new TextEncoder().encode(text), urlSafe);
export const decodeText = (text, urlSafe = false) => new TextDecoder('utf-8', { fatal: true }).decode(decodeBytes(text, urlSafe));
