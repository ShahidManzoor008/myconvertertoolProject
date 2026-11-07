export const capitalizeWords = text => text.toLowerCase().replace(/(^|[\s—–-])(\p{L})/gu, (_, prefix, letter) => prefix + letter.toUpperCase());
export const sentenceCase = text => text.toLowerCase().replace(/(^|[.!?]\s+)([\s"“'‘(]*)(\p{L})/gu, (_, prefix, quote, letter) => prefix + quote + letter.toUpperCase());
const syllables = word => {
  const clean = word.toLowerCase().replace(/[^a-z]/g, '');
  return clean ? Math.max(1, (clean.match(/[aeiouy]+/g) || []).length - (clean.endsWith('e') ? 1 : 0)) : 0;
};
export function analyzeText(text) {
  const trimmed = text.trim();
  const words = typeof Intl.Segmenter === 'function'
    ? Array.from(new Intl.Segmenter(undefined, { granularity: 'word' }).segment(trimmed)).filter(part => part.isWordLike).map(part => part.segment)
    : (trimmed.match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu) || []);
  const sentences = (trimmed.match(/[^.!?。！？]+(?:[.!?。！？]+|$)/gu) || []).filter(part => /[\p{L}\p{N}]/u.test(part)).length;
  const english = words.length > 0 && words.every(word => /^[a-zA-Z'’-]+$/.test(word));
  const stop = new Set(['the', 'and', 'for', 'that', 'with', 'this', 'from', 'are', 'you', 'your', 'into', 'have', 'has', 'was', 'were', 'will', 'can', 'our', 'not', 'but', 'all']);
  const frequencies = new Map();
  for (const word of words.map(word => word.toLowerCase())) {
    if (Array.from(word).length > 2 && !stop.has(word)) frequencies.set(word, (frequencies.get(word) || 0) + 1);
  }
  return {
    words: words.length,
    characters: Array.from(text).length,
    charactersNoSpaces: Array.from(text.replace(/\s/gu, '')).length,
    sentences,
    paragraphs: trimmed ? trimmed.split(/\n\s*\n/).filter(Boolean).length : 0,
    readingTime: words.length ? Math.max(1, Math.ceil(words.length / 225)) : 0,
    speakingTime: words.length ? Math.max(1, Math.ceil(words.length / 140)) : 0,
    readingEase: english && sentences ? Math.round(206.835 - 1.015 * words.length / sentences - 84.6 * words.reduce((sum, word) => sum + syllables(word), 0) / words.length) : null,
    topKeywords: Array.from(frequencies, ([word, count]) => ({ word, count })).sort((a, b) => b.count - a.count).slice(0, 8),
  };
}
