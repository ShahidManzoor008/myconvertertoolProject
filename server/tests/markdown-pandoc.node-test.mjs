import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import markdownit from 'markdown-it';
import JSZip from 'jszip';
import { PDFDocument, PDFName, PDFRawStream } from 'pdf-lib';
import markdownMath from '../utils/markdownMath.js';
import markdownSimpleTables from '../utils/markdownSimpleTables.js';
import { renderMarkdownHtml, convertMarkdownContentToDocx } from '../utils/markdownUtils.js';
import { convertFileToPDF } from '../utils/pdfConversionUtils.js';

const parser = markdownit().use(markdownMath).use(markdownSimpleTables);
const flatten = tokens => tokens.flatMap(token => [token, ...flatten(token.children || [])]);

test('Pandoc raw spans and nested fences normalize into complete equations', () => {
  const source = String.raw`Inline \`\frac{1}{2}\`{=tex} and \`\`\alpha\`\`{=tex}.

\[ a\<b \`\Rightarrow \`{=tex}a+c\<b+c \]

\[ x\^2+z\_1=\|a\| \]

\[ A=
~~~{=tex}
\begin{bmatrix}a&b\\c&d\end{bmatrix}
~~~
\]

~~~{=tex}
\sum_{k=1}^n k
~~~
`.replaceAll('\\`', '`');
  const math = flatten(parser.parse(source, {})).filter(token => /^math_/.test(token.type));
  assert.deepEqual(math.map(token => token.content.trim()), [
    String.raw`\frac{1}{2}`, String.raw`\alpha`,
    String.raw`a<b \Rightarrow a+c<b+c`, 'x^2+z_1=|a|',
    String.raw`A=
\begin{bmatrix}a&b\\c&d\end{bmatrix}`,
    String.raw`\sum_{k=1}^n k`,
  ]);
});

test('ordinary code remains literal and native LaTeX accents and norms stay intact', () => {
  const source = String.raw`\`ordinary\` then \`\alpha\`{=tex} and \`literal $x$\`.

~~~python
example = "\`\frac{a}{b}\`{=tex}"
~~~

    \`\beta\`{=tex}
`.replaceAll('\\`', '`');
  const tokens = flatten(parser.parse(source, {}));
  assert.deepEqual(tokens.filter(t => t.type === 'math_inline').map(t => t.content), [String.raw`\alpha`]);
  assert.deepEqual(tokens.filter(t => t.type === 'code_inline').map(t => t.content), ['ordinary', 'literal $x$']);
  assert.match(tokens.find(t => t.type === 'fence').content, /\{=tex\}/);
  assert.match(tokens.find(t => t.type === 'code_block').content, /\{=tex\}/);
  const native = flatten(parser.parse(String.raw`$\|v\| + \^{a}$`, {}));
  assert.equal(native.find(t => t.type === 'math_inline').content, String.raw`\|v\| + \^{a}`);
});

test('simple tables preserve columns, inline formatting and code boundaries', () => {
  const source = 'Name      Value\n--------  --------\n**Mass**  $m$\nSpeed     $v$\n\nNext paragraph.\n\n~~~text\nName      Value\n--------  --------\nMass      m\n~~~\n';
  const tokens = flatten(parser.parse(source, {}));
  assert.equal(tokens.filter(t => t.type === 'table_open').length, 1);
  assert.equal(tokens.filter(t => t.type === 'td_open').length, 4);
  assert.equal(tokens.filter(t => t.type === 'math_inline').length, 2);
  assert.equal(tokens.filter(t => t.type === 'strong_open').length, 1);
  assert.match(tokens.find(t => t.type === 'fence').content, /--------/);
});

test('the complete reported document exports every equation to DOCX and PDF', async () => {
  const source = await fs.readFile(new URL('./fixtures/mathematics_markdown_conversion_test.md', import.meta.url), 'utf8');
  const html = await renderMarkdownHtml(source);
  const equations = [...html.matchAll(/<img [^>]*src="data:image\/png;base64,([^"]+)"/g)];
  assert.equal(equations.length, 170);
  assert.equal((html.match(/<table>/g) || []).length, 3);
  assert.equal((html.match(/<h2>/g) || []).length, 20);
  assert.doesNotMatch(html, /\{=tex\}|__CODE_BLOCK_PLACEHOLDER_|alt="[^"]*\\[\^_<>|]/);
  assert.match(html, /def quadratic_roots\(a, b, c\):/);
  assert.match(html, /End of test document/);
  const word = await convertMarkdownContentToDocx(source, 'full Pandoc stress test');
  const zip = await JSZip.loadAsync(word);
  const xml = await zip.file('word/document.xml').async('string');
  assert.equal((xml.match(/<w:drawing>/g) || []).length, 170);
  assert.equal((xml.match(/<w:tbl>/g) || []).length, 3);
  assert.match(xml, /End of test document/);
  const media = new Set(await Promise.all(Object.values(zip.files)
    .filter(entry => entry.name.startsWith('word/media/') && !entry.dir)
    .map(entry => entry.async('base64'))));
  for (const [, encoded] of equations) assert.ok(media.has(encoded), 'Every rendered equation must be in the DOCX');
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'pandoc-conversion-'));
  try {
    const file = path.join(dir, 'stress.md');
    await fs.writeFile(file, source);
    const bytes = await convertFileToPDF(file, 'md');
    const pdf = await PDFDocument.load(bytes);
    assert.ok(pdf.getPageCount() >= 10);
    const images = pdf.context.enumerateIndirectObjects().filter(([, object]) =>
      object instanceof PDFRawStream && object.dict.get(PDFName.of('Subtype')) === PDFName.of('Image'));
    assert.ok(images.length >= new Set(equations.map(match => match[1])).size);
  } finally { await fs.rm(dir, { recursive: true, force: true }); }
});
