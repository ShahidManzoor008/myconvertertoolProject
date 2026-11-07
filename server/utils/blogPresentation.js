import corrections from './seededGuideCorrections.json' with { type: 'json' };
export const readingMinutes = content => Math.max(1, Math.ceil(String(content || '').replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length / 200));
// Only replace exact legacy seed templates. Independently edited articles remain untouched.
export function presentPost(value) {
  const post = value.toObject ? value.toObject() : { ...value };
  const correction = corrections[post.slug];
  if (correction && post.content === correction.before) post.content = correction.after;
  if (post.content) post.readingTime = readingMinutes(post.content);
  return post;
}
