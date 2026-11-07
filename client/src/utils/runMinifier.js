export const runMinifier = (code, language) => new Promise((resolve, reject) => {
  const worker = new Worker(new URL('./minify.worker.js', import.meta.url), { type: 'module' });
  const finish = (error, result) => { clearTimeout(timeout); worker.terminate(); error ? reject(error) : resolve(result); };
  const timeout = setTimeout(() => finish(new Error('Processing timed out. Try a smaller file.')), 30000);
  worker.onmessage = ({ data }) => finish(data.error ? new Error(data.error) : null, data.result);
  worker.onerror = () => finish(new Error('Unable to process this code.'));
  worker.postMessage({ code, language });
});
