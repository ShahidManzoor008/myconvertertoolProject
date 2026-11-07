// Isolated local QA server. Never connects to the production database or reads its .env.
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const uri = process.env.MONGO_URI_TEST || 'mongodb://127.0.0.1:27018/myconvertertool_audit_test';
const parsed = new URL(uri);
if (!['127.0.0.1', 'localhost'].includes(parsed.hostname) || !/^\/[a-zA-Z0-9_]+_test$/.test(parsed.pathname)) {
  throw new Error('QA requires a local MongoDB database whose name ends in _test.');
}
const build = path.resolve(process.env.FRONTEND_BUILD_DIR || '/tmp/myconvertertool-audit-build');
await fs.access(path.join(build, 'routes-manifest.json'));
const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'myconvertertool-qa-'));
await fs.mkdir(path.join(directory, 'uploads/blog-images'), { recursive: true });
process.chdir(directory);
Object.assign(process.env, {
  NODE_ENV: 'development', MONGODB_URI: uri,
  JWT_SECRET: 'isolated-local-qa-secret-never-use-for-production',
  PORT: process.env.AUDIT_PORT || '5057', HOST: '127.0.0.1', FRONTEND_BUILD_DIR: build,
});
process.env.CORS_ORIGIN = `http://127.0.0.1:${process.env.PORT}`;
await import(path.join(root, 'server/index.js'));
await mongoose.connection.asPromise();
const { default: Blog } = await import(path.join(root, 'server/models/Blog.js'));
const posts = JSON.parse(await fs.readFile(path.join(root, 'client/src/data/blogposts.json'), 'utf8'));
for (const post of posts) {
  await Blog.updateOne({ slug: post.id }, { $set: { title: post.title, content: post.content, excerpt: post.excerpt, author: 'MyConverterTool', readingTime: 1 } }, { upsert: true });
}
console.log(`QA ready at http://127.0.0.1:${process.env.PORT}; temporary files: ${directory}`);
