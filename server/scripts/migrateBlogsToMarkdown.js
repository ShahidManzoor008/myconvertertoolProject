import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { storeBlogImage, blogImageDirectory, imageReferences } from '../utils/blogMedia.js';
import { renderBlogContent } from '../utils/blogContent.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
dotenv.config({ path: path.join(root, 'server/.env'), quiet: true });
const apply = process.argv.includes('--apply');
const sourceDirectory = path.join(root, 'content/blog');
const manifest = JSON.parse(await readFile(path.join(sourceDirectory, 'manifest.json'), 'utf8'));
const revision = '2026-11-markdown-v1';
const sourceHash = post => createHash('sha256').update(JSON.stringify(['title','content','excerpt','author','coverImage','updatedAt'].map(key => post[key] ?? null))).digest('hex');
const connection = await mongoose.createConnection(process.env.MONGODB_URI, { autoIndex: false, autoCreate: false, serverSelectionTimeoutMS: 5000 }).asPromise();
try {
  const collection = connection.db.collection('blogs');
  const posts = await collection.find({ slug: { $in: manifest.map(item => item.slug) } }).toArray();
  const planned = [];
  for (const entry of manifest) {
    const post = posts.find(value => value.slug === entry.slug);
    if (!post) throw new Error(`Missing article: ${entry.slug}. No records changed.`);
    if (post.editorialRevision === revision) { console.log(`Already migrated: ${entry.slug}`); continue; }
    if (sourceHash(post) !== entry.expectedSourceHash) throw new Error(`Article changed since review: ${entry.slug}. Review it before migrating.`);
    const content = await readFile(path.join(sourceDirectory, `${entry.slug}.md`), 'utf8');
    const rendered = await renderBlogContent(content, 'markdown');
    planned.push({ entry, post, content, rendered });
  }
  if (!apply) {
    console.log(JSON.stringify({ dryRun: true, articles: planned.map(({ entry, rendered }) => ({ slug: entry.slug, title: entry.title, sections: rendered.headings.length, readingTime: rendered.readingTime })) }, null, 2));
  } else if (!planned.length) {
    console.log(JSON.stringify({ applied: true, updated: 0, alreadyMigrated: true }));
  } else {
    const backup = process.env.BLOG_BACKUP_DIR || path.join(process.env.HOME, '.local/state/myconvertertool-blog', new Date().toISOString().replace(/[:.]/g, '-'));
    await mkdir(backup, { recursive: true, mode: 0o700 });
    await writeFile(path.join(backup, 'posts.json'), JSON.stringify(posts, null, 2), { flag: 'wx', mode: 0o600 });
    for (const { entry } of planned) await copyFile(path.join(blogImageDirectory, entry.sourceImage), path.join(backup, entry.sourceImage));
    let updated = 0;
    for (const { entry, post, content, rendered } of planned) {
      const image = await storeBlogImage(await readFile(path.join(blogImageDirectory, entry.sourceImage)));
      const result = await collection.updateOne({ _id: post._id, content: post.content, updatedAt: post.updatedAt }, { $set: {
        title: entry.title, excerpt: entry.excerpt, content, contentFormat: 'markdown', author: 'MyConverterTool Team', authorType: 'Organization',
        category: entry.category, tags: entry.tags, coverAlt: entry.coverAlt, coverImage: image.url, coverThumbnail: image.thumbnail, coverWidth: image.width, coverHeight: image.height, coverThumbnailWidth: image.thumbnailWidth,
        imageFiles: imageReferences({ content, coverImage: image.url, coverThumbnail: image.thumbnail }),
        status: post.status || 'published', publishedAt: post.publishedAt || post.createdAt,
        readingTime: rendered.readingTime, revision: (post.revision || 0) + 1, updatedAt: new Date(), editorialRevision: revision,
      } });
      if (!result.modifiedCount) throw new Error(`Concurrent update detected for ${entry.slug}; migration stopped. Backup: ${backup}`);
      updated++;
    }
    console.log(JSON.stringify({ applied: true, updated, backup }));
  }
} finally { await connection.close(); }
