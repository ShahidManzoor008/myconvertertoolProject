// Parse math alongside Markdown so code, escaped delimiters and link URLs stay intact.
export default function markdownMath(md) {
  const escaped = (text, index) => {
    let slashes = 0;
    while (index > 0 && text[--index] === '\\') slashes++;
    return slashes % 2 === 1;
  };
  const findClose = (text, delimiter, from) => {
    let index = text.indexOf(delimiter, from);
    while (index !== -1 && escaped(text, index)) index = text.indexOf(delimiter, index + delimiter.length);
    return index;
  };

  md.inline.ruler.before('escape', 'math', (state, silent) => {
    const start = state.pos;
    const text = state.src;
    const opener = ['$$', '\\[', '\\(', '$'].find(value => text.startsWith(value, start));
    if (!opener) return false;
    const closer = { '$$': '$$', '\\[': '\\]', '\\(': '\\)', '$': '$' }[opener];
    const from = start + opener.length;
    if (opener === '$' && /\s|\$/u.test(text[from] || ' ')) return false;
    const end = findClose(text, closer, from);
    if (opener === '$' && end !== -1
      && (/\s/u.test(text[end - 1]) || /[\d$]/.test(text[end + 1] || ''))) return false;
    if (end === -1 || end + closer.length > state.posMax || end === from || (opener === '$' && text.slice(from, end).includes('\n'))) return false;
    if (!silent) {
      const token = state.push('math_inline', '', 0);
      token.content = text.slice(from, end).trim();
      token.meta = { display: opener === '$$' || opener === '\\[' };
    }
    state.pos = end + closer.length;
    return true;
  });

  md.block.ruler.before('fence', 'math_block', (state, startLine, endLine, silent) => {
    const start = state.bMarks[startLine] + state.tShift[startLine];
    const first = state.src.slice(start, state.eMarks[startLine]);
    const environment = first.match(/^\\begin\{(equation\*?|align\*?|gather\*?|multline\*?|displaymath)\}/);
    const opener = first.startsWith('$$') ? '$$' : first.startsWith('\\[') ? '\\[' : environment?.[0];
    if (!opener || state.sCount[startLine] - state.blkIndent >= 4) return false;
    const closer = environment ? `\\end{${environment[1]}}` : opener === '$$' ? '$$' : '\\]';
    let line = startLine;
    let end;
    for (; line < endLine; line++) {
      const from = line === startLine ? start + opener.length : state.bMarks[line] + state.tShift[line];
      const segment = state.src.slice(from, state.eMarks[line]);
      const index = findClose(segment, closer, 0);
      if (index !== -1 && !segment.slice(index + closer.length).trim()) {
        end = from + index;
        break;
      }
    }
    if (end === undefined) return false;
    if (silent) return true;
    const token = state.push('math_block', '', 0);
    const lines = state.getLines(startLine, line + 1, state.blkIndent, false).trim();
    token.content = environment ? lines : lines.slice(opener.length, -closer.length).trim();
    token.meta = { display: true };
    token.map = [startLine, line + 1];
    state.line = line + 1;
    return true;
  }, { alt: ['paragraph', 'reference', 'blockquote', 'list'] });

  // Fenced math is common in Markdown exported from notebooks and GitHub.
  md.core.ruler.after('inline', 'math_fences', state => {
    const visit = tokens => {
      for (const token of tokens) {
        if (token.type === 'fence' && /^(math|latex|tex)$/i.test(token.info.trim())) {
          token.type = 'math_block';
          token.meta = { display: true };
        }
        if (token.children) visit(token.children);
      }
    };
    visit(state.tokens);
    // Only a list item's first paragraph is a task; preserve ordinary [x] text.
    for (let index = 2; index < state.tokens.length; index++) {
      const token = state.tokens[index];
      if (token.type === 'inline' && state.tokens[index - 1].type === 'paragraph_open'
        && state.tokens[index - 2].type === 'list_item_open' && token.children?.[0]?.type === 'text') {
        token.children[0].content = token.children[0].content.replace(/^\[([ xX])\]\s+/, (_, checked) => checked === ' ' ? '☐ ' : '☑ ');
      }
    }
  });
  md.renderer.rules.math_inline = (tokens, index) => tokens[index].meta.html;
  md.renderer.rules.math_block = (tokens, index) => `<p style="text-align: center; margin: 12px 0;">${tokens[index].meta.html}</p>\n`;
}
