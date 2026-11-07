import { minifyCode } from './codeMinify';
self.onmessage = async ({ data }) => {
  try { self.postMessage({ result: await minifyCode(data.code, data.language) }); }
  catch (error) { self.postMessage({ error: error.message }); }
};
