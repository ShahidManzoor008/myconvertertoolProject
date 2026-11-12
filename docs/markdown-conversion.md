# Markdown to DOCX and PDF

The Word converter accepts pasted Markdown and `.md` / `.markdown` uploads.
The PDF converter accepts `.md` and `.markdown` uploads through its existing
file conversion flow. Both formats use the same Markdown and equation renderer.
Plain `.txt` files in the PDF converter remain plain text.

Supported content includes headings, emphasis, strikethrough, blockquotes,
nested lists, aligned tables, fenced/indented code, hyperlinks, embedded PNG/JPEG
images, task lists (`- [x]` / `- [ ]`), footnotes, definition lists, subscripts
(`H~2~O`), and superscripts (`x^2^`). Footnotes appear as a numbered notes section
at the end of the document. Task checkboxes are printable symbols.

Math syntax:

- Inline: `$E=mc^2$` or `\(E=mc^2\)`.
- Display: `$$ ... $$` or `\[ ... \]` on their own lines.
- Fenced blocks with the language `math`, `latex`, or `tex`.
- Standalone `equation`, `align`, `gather`, `multline`, and `displaymath`
  environments, including starred variants where applicable.

For example:

````markdown
The roots of $ax^2 + bx + c = 0$ are:

$$
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$

```math
A = \begin{pmatrix}1 & 2 \\ 3 & 4\end{pmatrix}
```

| Quantity | Value |
|:---|---:|
| Energy | $E=mc^2$ |

Water is H~2~O.[^note]

[^note]: Equations can also appear in notes: $a+b$.

- [x] Review equations
- [ ] Export document
````

Equations are high resolution PNG images with explicit layout dimensions, so
Word and PDF display the complete expression without fetching fonts or running
scripts. They are not editable Word equation objects. `IMAGE_DENSITY` controls
raster resolution (96–600 DPI, default 300); equations wider than the document
are scaled proportionally. The old `LATEX_IMAGE_FORMAT` override is no longer
used because SVG images were removed by the DOCX sanitizer.

Code spans, backtick and tilde fences, indented code, escaped dollar signs, and
ordinary prices such as `$5 and $10` remain literal. Malformed equations return
a conversion error rather than silently disappearing. MathJax supports math
notation, not full LaTeX documents or arbitrary LaTeX packages. Mermaid and
other diagram code fences remain code. External and local-file images are not
fetched; their descriptions are preserved as text.
