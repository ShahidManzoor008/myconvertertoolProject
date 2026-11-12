import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import JSZip from 'jszip';
import { PDFDocument, PDFName, PDFRawStream } from 'pdf-lib';
import { renderMarkdownHtml, convertMarkdownContentToDocx, convertMarkdownToDocx } from '../utils/markdownUtils.js';
import { validateUploadedFile } from '../utils/fileUtils.js';
import { convertFileToPDF } from '../utils/pdfConversionUtils.js';

const fixture = String.raw`# Scientific notes

Inline $\alpha + \beta = \gamma$ and \(x^2 + y^2\).

$$
\frac{-b \pm \sqrt{b^2-4ac}}{2a}
$$

$$E=mc^2 \tag{1}$$

\[
\begin{pmatrix}1 & 2 \\ 3 & 4\end{pmatrix}
\]

\begin{align}
x &= 1 \\
y &= 2
\end{align}

~~~math
\sum_{i=1}^{n} i
~~~

| Formula | Description |
|:---|---:|
| $E=mc^2$ | energy |

- [x] Complete
- [ ] Pending
  - Nested item

H~2~O and x^2^ and ~~removed~~.

Term
: Definition

A reference[^note].

[^note]: Footnote with $a+b$.

~~~js
const price = '$25';
~~~
`;

const images = html => [...html.matchAll(/<img [^>]+>/g)];

test('all equation syntaxes, matrices, tables, and notes produce embedded images', async () => {
  const html = await renderMarkdownHtml(fixture);
  assert.equal(images(html).length, 9);
  assert.match(html, /text-align:center/);
  assert.match(html, /<table>/);
  assert.match(html, /text-align:right/);
  assert.match(html, /<sub>2<\/sub>/);
  assert.match(html, /<sup>2<\/sup>/);
  assert.match(html, /<s>removed<\/s>/);
  assert.match(html, /<dl>/);
  assert.match(html, /☑ Complete/);
  assert.match(html, /☐ Pending/);
  assert.match(html, /Footnote with/);
  assert.match(html, /href="#fn1"/);
  assert.match(html, /const price = '\$25';/);
});

test('inline sums retain the whole equation instead of only the first MathJax SVG fragment', async () => {
  const html = await renderMarkdownHtml(String.raw`$\alpha + \beta = \gamma$`);
  assert.equal(images(html).length, 1);
  const width = Number(html.match(/width="(\d+)"/)[1]);
  assert.ok(width > 60, `Equation should include every term, got ${width}px`);
});

test('tagged equations retain both the expression and its number', async () => {
  const html = await renderMarkdownHtml(String.raw`$$E=mc^2 \tag{1}$$`);
  assert.match(html, /width="620"/);
  const bytes = Buffer.from(html.match(/base64,([^"]+)/)[1], 'base64');
  const { data, info } = await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const hasInk = (left, right) => {
    for (let y = 0; y < info.height; y++) {
      for (let x = Math.floor(info.width * left); x < info.width * right; x++) {
        if (data[(y * info.width + x) * 4 + 3] > 100) return true;
      }
    }
    return false;
  };
  assert.ok(hasInk(0.3, 0.7), 'The centered expression must be visible');
  assert.ok(hasInk(0.9, 1), 'The right-hand equation number must be visible');
});

test('code fences, indented code, backtick spans, escaped dollars and prices remain literal', async () => {
  const html = await renderMarkdownHtml(String.raw`Prices $5 and $10, escaped \$x\$, unmatched $x.

[x] ordinary paragraph

~~~text
$x+y$
~~~

\`\`code $z$ with \` inside\`\`

    $indented$
`.replaceAll('\\`', '`'));
  assert.equal(images(html).length, 0);
  assert.match(html, /Prices \$5 and \$10/);
  assert.match(html, /\[x\] ordinary paragraph/);
  assert.match(html, /\$indented\$/);
  assert.match(html, /<code>code \$z\$ with ` inside<\/code>/);
});

test('prices next to real math do not swallow the equation', async () => {
  const html = await renderMarkdownHtml('Prices $5 and $10; formula $x+y$.');
  assert.equal(images(html).length, 1);
  assert.match(html, /Prices \$5 and \$10; formula/);
  assert.match(html, /alt="x\+y"/);
});

test('unsafe markup and remote images are omitted without losing their description', async () => {
  const html = await renderMarkdownHtml('<script>alert(1)</script>\n\n<img src="file:///etc/passwd" onerror="alert(1)" alt="diagram">\n\n![remote](https://example.com/image.png)');
  assert.doesNotMatch(html, /<script|onerror|file:\/\/|src="https:/);
  assert.match(html, /diagram/);
  assert.match(html, /remote/);
});

test('malformed equations report a useful error instead of silently losing content', async () => {
  await assert.rejects(renderMarkdownHtml(String.raw`$\frac{a}{$`), /LaTeX equation/);
});

test('DOCX contains real equation media, tables, and both file and pasted input work', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'markdown-docx-'));
  try {
    const file = path.join(dir, 'notes.markdown');
    await fs.writeFile(file, fixture);
    for (const buffer of [await convertMarkdownContentToDocx(fixture), await convertMarkdownToDocx(file)]) {
      const zip = await JSZip.loadAsync(buffer);
      const document = await zip.file('word/document.xml').async('string');
      assert.match(document, /<w:tbl>/);
      assert.match(document, /<w:drawing>/);
      assert.match(document, /Scientific notes/);
      const media = Object.values(zip.files).filter(entry => entry.name.startsWith('word/media/') && !entry.dir);
      const buffers = await Promise.all(media.map(entry => entry.async('nodebuffer')));
      const html = await renderMarkdownHtml(fixture);
      for (const match of html.matchAll(/src="data:image\/png;base64,([^"]+)"/g)) {
        const expected = Buffer.from(match[1], 'base64');
        assert.ok(buffers.some(buffer => buffer.equals(expected)), 'Every equation must be embedded in the DOCX');
      }
      assert.match(document, /Footnote with/);
      assert.match(document, /Definition/);
      assert.match(document, /☑/);
      assert.match(document, /w:val="subscript"/);
      assert.match(document, /w:val="superscript"/);
    }
  } finally { await fs.rm(dir, { recursive: true, force: true }); }
});

test('PDF embeds every equation for .md and .markdown, even when the stored file has no extension', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'markdown-pdf-'));
  try {
    const file = path.join(dir, 'upload');
    await fs.writeFile(file, fixture);
    for (const type of ['md', 'markdown']) {
      assert.equal(await validateUploadedFile(file, `notes.${type}`, ['text/markdown']), true);
      assert.equal(await validateUploadedFile(file, `notes.${type}`, ['text/plain']), false);
      const buffer = await convertFileToPDF(file, type);
      const pdf = await PDFDocument.load(buffer);
      assert.ok(pdf.getPageCount() >= 1);
      const embedded = pdf.context.enumerateIndirectObjects().filter(([, object]) =>
        object instanceof PDFRawStream && object.dict.get(PDFName.of('Subtype')) === PDFName.of('Image'));
      // Transparent PNGs may also have grayscale alpha masks.
      assert.ok(embedded.length >= 9, `Only ${embedded.length} PDF images were embedded`);
    }
    // Plain text must stay literal even if it happens to contain Markdown math.
    const plain = await PDFDocument.load(await convertFileToPDF(file, 'txt'));
    const embedded = plain.context.enumerateIndirectObjects().filter(([, object]) =>
      object instanceof PDFRawStream && object.dict.get(PDFName.of('Subtype')) === PDFName.of('Image'));
    assert.equal(embedded.length, 0);
  } finally { await fs.rm(dir, { recursive: true, force: true }); }
});
