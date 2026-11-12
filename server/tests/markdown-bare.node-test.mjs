import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import markdownit from 'markdown-it';
import JSZip from 'jszip';
import { PDFDocument, PDFName, PDFRawStream } from 'pdf-lib';
import markdownMath from '../utils/markdownMath.js';
import { renderMarkdownHtml, convertMarkdownContentToDocx } from '../utils/markdownUtils.js';
import { convertFileToPDF } from '../utils/pdfConversionUtils.js';

const parser = markdownit().use(markdownMath);
const flatten = tokens => tokens.flatMap(t => [t, ...flatten(t.children || [])]);
const fixture = new URL('./fixtures/copper-saving.md', import.meta.url);

test('reported escaped, undelimited equations become complete calculation steps', async () => {
  const tokens = flatten(parser.parse(await fs.readFile(fixture, 'utf8'), {}));
  const math = tokens.filter(t => t.type === 'math_block');
  assert.equal(math.length, 9);
  assert.equal(math[0].content, String.raw`A\propto\frac{1}{V^2}`);
  assert.equal(math[1].content, String.raw`S=\left[1-\left(\frac{V_1}{V_2}\right)^2\right]\times100`);
  assert.equal(math[4].content, String.raw`S=(1-0.1837)\times100`);
  assert.equal(math[8].content, String.raw`S_{\text{additional}}=
\left[1-\left(\frac{560}{600}\right)^2\right]\times100=(1-0.8711)\times100=12.89\%`);
  assert.ok(tokens.some(t => t.type === 'text' && t.content === 'Answer: 81.63% copper saving'));
  assert.ok(tokens.some(t => t.type === 'text' && t.content === 'Answer: 84% copper saving'));
});

test('bare detection preserves prose, code, links, and explicitly delimited LaTeX', () => {
  const source = String.raw`A=an explanation with \frac{1}{2} in prose.

~~~text
S=\\frac{1}{2}
~~~

    S=\\frac{1}{2}

\`S=\\frac{1}{2}\`

[Example](https://example.com/S=example)

$\|v\| + \^{a}$

\[ A=\begin{bmatrix}a&b\\c&d\end{bmatrix} \]

S=\left[1-\frac{1}{2}\right]\times100
`.replaceAll('\\`', '`');
  const tokens = flatten(parser.parse(source, {}));
  assert.equal(tokens.filter(t => /^math_/.test(t.type)).length, 3);
  assert.equal(tokens.find(t => t.type === 'math_inline').content, String.raw`\|v\| + \^{a}`);
  assert.equal(tokens.filter(t => t.type === 'math_block')[0].content, String.raw`A=\begin{bmatrix}a&b\\c&d\end{bmatrix}`);
  assert.equal(tokens.filter(t => t.type === 'math_block')[1].content, String.raw`S=\left[1-\frac{1}{2}\right]\times100`);
  assert.match(tokens.find(t => t.type === 'fence').content, /\\\\frac/);
  assert.match(tokens.find(t => t.type === 'code_block').content, /\\\\frac/);
  assert.match(tokens.find(t => t.type === 'code_inline').content, /\\\\frac/);
});

test('copper-saving sample exports all nine equations and three tables to DOCX and PDF', async () => {
  const source = await fs.readFile(fixture, 'utf8');
  const html = await renderMarkdownHtml(source);
  assert.equal((html.match(/<img /g) || []).length, 9);
  assert.equal((html.match(/<table>/g) || []).length, 3);
  assert.match(html, /Answer: 81.63% copper saving/);
  assert.match(html, /Answer: 84% copper saving/);
  const word = await convertMarkdownContentToDocx(source, 'Copper saving regression');
  const zip = await JSZip.loadAsync(word);
  const xml = await zip.file('word/document.xml').async('string');
  assert.equal((xml.match(/<w:drawing>/g) || []).length, 9);
  assert.equal((xml.match(/<w:tbl>/g) || []).length, 3);
  assert.match(xml, /My examination advice/);
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'bare-math-'));
  try {
    const file = path.join(dir, 'copper.md');
    await fs.writeFile(file, source);
    const bytes = await convertFileToPDF(file, 'md');
    const pdf = await PDFDocument.load(bytes);
    const images = pdf.context.enumerateIndirectObjects().filter(([, object]) =>
      object instanceof PDFRawStream && object.dict.get(PDFName.of('Subtype')) === PDFName.of('Image'));
    assert.ok(images.length >= 9);
    await fs.writeFile('/tmp/copper-saving-fixed.pdf', bytes);
    await fs.writeFile('/tmp/copper-saving-fixed.docx', word);
  } finally { await fs.rm(dir, { recursive: true, force: true }); }
});
