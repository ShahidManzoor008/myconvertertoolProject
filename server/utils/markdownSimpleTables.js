// Single-line Pandoc simple tables: columns separated by two or more spaces,
// with a dashed separator row. Run before paragraph parsing, never inside code.
export default function markdownSimpleTables(md) {
  md.block.ruler.before('table', 'simple_table', (state, startLine, endLine, silent) => {
    if (startLine + 2 >= endLine || state.sCount[startLine] - state.blkIndent >= 4) return false;
    const line = index => state.getLines(index, index + 1, state.blkIndent, false).trim();
    const separator = line(startLine + 1);
    if (!/^-{3,}(?: +-{3,})+$/.test(separator)) return false;
    const count = separator.split(/ +/).length;
    const cells = value => value.split(/ {2,}/);
    const header = cells(line(startLine));
    if (header.length !== count) return false;
    const rows = [];
    let next = startLine + 2;
    for (; next < endLine && !state.isEmpty(next); next++) {
      const row = cells(line(next));
      if (row.length !== count) break;
      rows.push(row);
    }
    if (!rows.length) return false;
    if (silent) return true;
    const open = state.push('table_open', 'table', 1);
    open.map = [startLine, next];
    const emitRow = (row, tag) => {
      state.push('tr_open', 'tr', 1);
      for (const content of row) {
        state.push(`${tag}_open`, tag, 1);
        const token = state.push('inline', '', 0);
        token.content = content;
        token.children = [];
        state.push(`${tag}_close`, tag, -1);
      }
      state.push('tr_close', 'tr', -1);
    };
    state.push('thead_open', 'thead', 1);
    emitRow(header, 'th');
    state.push('thead_close', 'thead', -1);
    state.push('tbody_open', 'tbody', 1);
    rows.forEach(row => emitRow(row, 'td'));
    state.push('tbody_close', 'tbody', -1);
    state.push('table_close', 'table', -1);
    state.line = next;
    return true;
  }, { alt: ['paragraph', 'reference'] });
}
