// Parse math alongside Markdown so code, escaped delimiters and link URLs stay intact.
// Pandoc exports sometimes mix raw TeX code attributes with Markdown escapes
// inside math. Normalize only those equations; ordinary LaTeX stays untouched.
const normalizePandocMath = source => {
  return source
    .replace(/^([`~]{3,})\{=tex\}[^\S\n]*\n([\s\S]*?)\n\1[^\S\n]*$/gim, '$2')
    .replace(/(`+)([\s\S]*?)\1\{=tex\}/gi, '$2')
    .replace(/\\([\^_<>|])/g, '$1');
};

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

  // Some pasted notes omit math delimiters and double-escape TeX commands.
  // Recognize only equation-shaped paragraphs, before Markdown treats \[ as
  // a display delimiter or consumes the backslashes. Code and prose stay literal.
  md.block.ruler.before('paragraph', 'bare_equation', (state, startLine, endLine, silent) => {
    if (state.sCount[startLine] - state.blkIndent >= 4) return false;
    const first = state.src.slice(state.bMarks[startLine] + state.tShift[startLine], state.eMarks[startLine]);
    if (!/^[A-Za-z](?:_\{[^\n]+\}|_[A-Za-z0-9]+)?\s*(?:=|\\{1,2}(?:propto|approx|equiv)\b)/.test(first)) return false;
    let end = startLine + 1;
    while (end < endLine && !state.isEmpty(end)) {
      const next = state.src.slice(state.bMarks[end] + state.tShift[end], state.eMarks[end]);
      if (!/^\s*(?:\\{1,2}[A-Za-z]+|[=+\-({\d]|[A-Za-z](?:_\{[^}]+\})?\s*=)/.test(next)) break;
      end++;
    }
    const source = state.getLines(startLine, end, state.blkIndent, false).trim();
    // An assignment alone could be code or ordinary prose. Require a known
    // mathematical command, and leave explicitly delimited equations alone.
    if (!/\\{1,2}(?:frac|propto|left|right|times|sqrt|sum|int|approx|equiv)\b/.test(source)
      || /[`$]|\\(?:\(|begin\{)/.test(source)) return false;
    const answerAt = source.search(/Answer\s*:/i);
    let equation = answerAt < 0 ? source : source.slice(0, answerAt);
    equation = equation
      .replace(/\\\\(?=[A-Za-z])/g, '\\')
      .replace(/\\([\[\]])/g, '$1')
      .replace(/\\\\%/g, '\\%');
    // Do not turn words in a prose paragraph into implicit mathematical text.
    const withoutCommands = equation.replace(/\\text\{[^}]*\}/g, '').replace(/\\[A-Za-z]+/g, '');
    if (/[A-Za-z]{3,}/.test(withoutCommands)) return false;
    if (silent) return true;
    const steps = equation.replace(/([\d)}\]])(?=[A-Za-z]=)/g, '$1\n').split(/\n(?=[A-Za-z]=)/);
    for (const step of steps) {
      const token = state.push('math_block', '', 0);
      token.content = step.trim();
      token.meta = { display: true };
      token.map = [startLine, end];
    }
    if (answerAt >= 0) {
      state.push('paragraph_open', 'p', 1);
      const answer = state.push('inline', '', 0);
      answer.content = source.slice(answerAt);
      answer.children = [];
      state.push('paragraph_close', 'p', -1);
    }
    state.line = end;
    return true;
  });

  md.inline.ruler.before('backticks', 'pandoc_tex', (state, silent) => {
    const start = state.pos;
    if (state.src[start] !== '`') return false;
    const ticks = state.src.slice(start).match(/^`+/)[0];
    let end = start + ticks.length;
    while ((end = state.src.indexOf(ticks, end)) !== -1) {
      if (state.src[end + ticks.length] !== '`' && state.src.startsWith('{=tex}', end + ticks.length)) {
        const next = end + ticks.length + 6;
        if (next > state.posMax) return false;
        if (!silent) {
          const token = state.push('math_inline', '', 0);
          token.content = state.src.slice(start + ticks.length, end).replace(/\n/g, ' ');
          token.meta = { display: false, pandoc: true };
        }
        state.pos = next;
        return true;
      }
      // A completed ordinary code span belongs to Markdown, even if a later
      // span has a raw TeX attribute.
      if (state.src[end - 1] !== '`' && state.src[end + ticks.length] !== '`') return false;
      end += ticks.length;
    }
    return false;
  });

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
    const flat = [];
    const collect = tokens => {
      for (const token of tokens) {
        flat.push(token);
        if (token.children) collect(token.children);
      }
    };
    collect(state.tokens);
    const pandoc = flat.some(token => token.meta?.pandoc
      || (/^math_/.test(token.type) && /\{=tex\}/i.test(token.content))
      || (token.type === 'fence' && token.info.trim() === '{=tex}'));
    const visit = tokens => {
      for (const token of tokens) {
        if (token.type === 'fence' && /^(math|latex|tex|\{=tex\})$/i.test(token.info.trim())) {
          token.type = 'math_block';
          token.meta = { display: true };
        }
        if (pandoc && /^math_/.test(token.type)) token.content = normalizePandocMath(token.content);
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
