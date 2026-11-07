import { describe, test, expect } from 'vitest';
import { encodeText, decodeText, encodeBytes, decodeBytes } from './encoding';
import { buildMetaTags } from './metaTags';
import { minifyCode } from './codeMinify';
import { analyzeText, sentenceCase, capitalizeWords } from './textAnalysis';
import { buildQrPayload, checkQrColors } from './qrPayload';
import { parse, stringify } from 'lossless-json';
import { jsonrepair } from 'jsonrepair';

describe('data conversion regressions', () => {
  test('UTF-8 text round-trips in standard and URL-safe Base64', () => {
    expect(encodeText('Hello')).toBe('SGVsbG8=');
    for (const text of ['你好 🌍 café', '\u0000\n', '', 'مرحبا']) {
      expect(decodeText(encodeText(text))).toBe(text);
      expect(decodeText(encodeText(text, true), true)).toBe(text);
    }
    for (const invalid of ['A', '%%%=', 'ab=c', 'SGVsbG8===', 'Zh==']) expect(() => decodeBytes(invalid)).toThrow();
  });
  test('binary export preserves every byte', () => {
    const bytes = Uint8Array.from({ length: 256 }, (_, index) => index);
    expect(decodeBytes(encodeBytes(bytes))).toEqual(bytes);
  });
  test('meta exports cannot inject tags or attributes', () => {
    const tags = buildMetaTags({ title: '</title><script>alert(1)</script>', description: '" onload="bad & worse', url: 'https://example.com/?a=1&b=2' });
    const template = document.createElement('template'); template.innerHTML = tags;
    expect(template.content.querySelector('script')).toBeNull();
    expect(template.content.querySelector('meta').getAttribute('content')).toBe('" onload="bad & worse');
    expect(template.content.querySelector('meta').hasAttribute('onload')).toBe(false);
    expect(() => buildMetaTags({ title: '', description: '', url: 'javascript:alert(1)' })).toThrow();
  });
  test('JSON preserves long numeric values and repairs strings without damaging their contents', () => {
    const source = '{"id":900719925474099312345,"text":"{foo: 1,}","quote":"don\'t"}';
    expect(stringify(parse(source))).toBe(source);
    expect(parse(jsonrepair("{name: 'café', list: [1,2,],}"))).toMatchObject({ name: 'café' });
    expect(stringify(parse(jsonrepair(source)))).toBe(source);
  });
});

describe('minifier output semantics', () => {
  test('JavaScript preserves URLs, regexes, templates and newline-sensitive return', async () => {
    const source = '(() => { const url = "https://example.com/a  b"; const re=/a\\/\\/b/; const tpl=`two  spaces`; function f(){return\n42;} return [url,re.source,tpl,f()]; })()';
    const result = await minifyCode(source, 'js');
    expect(Function('return ' + result)()).toEqual(Function('return ' + source)());
    await expect(minifyCode('const = ;', 'js')).rejects.toThrow();
  });
  test('CSS retains URL and quoted text', async () => {
    const result = await minifyCode('a { background: url("https://example.com/x.png"); content: "two  spaces"; }', 'css');
    expect(result).toContain('https://example.com/x.png'); expect(result).toContain('two  spaces');
  });
  test('HTML preserves preformatted content, inline spaces and script strings', async () => {
    const source = '<!-- comment --><span>Hello</span> <span>world</span><pre>a  b\n c</pre><script>const x = "https://a/b";</script>';
    const result = await minifyCode(source, 'html');
    expect(result).toContain('</span> <span>'); expect(result).toContain('<pre>a  b\n c</pre>'); expect(result).toContain('https://a/b'); expect(result).not.toContain('<!-- comment -->');
  });
});

describe('text results', () => {
  test('counts English, Unicode, empty text and keyword-like object properties', () => {
    expect(analyzeText('Hello world.')).toMatchObject({ words: 2, characters: 12, sentences: 1, paragraphs: 1 });
    expect(analyzeText('   \n')).toMatchObject({ words: 0, sentences: 0, paragraphs: 0 });
    expect(analyzeText('café résumé 🌍')).toMatchObject({ words: 2, characters: 13 });
    expect(analyzeText('constructor constructor')).toMatchObject({ topKeywords: [{ word: 'constructor', count: 2 }] });
    expect(analyzeText('你好 世界').words).toBeGreaterThan(0);
  });
  test('capitalizes each sentence and Unicode word', () => {
    expect(sentenceCase('HELLO. WORLD! AGAIN? YES.')).toBe('Hello. World! Again? Yes.');
    expect(capitalizeWords('ÉCOLE café')).toBe('École Café');
  });
});

describe('QR payloads', () => {
  test('Wi-Fi credentials are escaped and terminated', () => {
    expect(buildQrPayload('wifi', { wifi: { ssid: 'A;B', password: 'x:y', encryption: 'WPA' } })).toBe('WIFI:T:WPA;S:A\\;B;P:x\\:y;;');
  });
  test('location accepts zero and rejects out-of-range numbers', () => {
    expect(buildQrPayload('location', { location: { latitude: '0', longitude: '0' } })).toBe('geo:0,0');
    expect(() => buildQrPayload('location', { location: { latitude: '91', longitude: '0' } })).toThrow();
  });
  test('calendar dates have seconds, contacts escape injected field boundaries', () => {
    const result = buildQrPayload('event', { event: { title: 'Meeting', start: '2026-11-06T09:30', end: '', location: '', description: '' } });
    expect(result).toContain('DTSTART:20261106T093000\r\n');
    const card = buildQrPayload('contact', { contact: { name: 'A\nTEL:fake', phone: '', email: '', address: '', website: '' } });
    expect(card).toContain('FN:A\\nTEL:fake\r\n');
  });
  test('rejects oversized payloads and unreadable colors', () => {
    expect(() => buildQrPayload('text', { text: '🌍'.repeat(251) })).toThrow();
    expect(() => checkQrColors('#ffffff', '#ffffff')).toThrow();
    expect(() => checkQrColors('#000000', '#ffffff')).not.toThrow();
  });
});
