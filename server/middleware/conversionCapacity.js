// One conversion request at a time on the 1 GB host. Reject excess work before
// accepting uploads, instead of letting multiple Chrome processes exhaust RAM.
let active = false;
export const conversionCapacity = (req, res, next) => {
  if (active) return res.status(503).set('Retry-After', '5').json({ error: 'Converter is busy. Please try again shortly.' });
  if (Number(req.headers['content-length']) > 100 * 1024 * 1024) {
    return res.status(413).json({ error: 'Request exceeds the 100 MB upload limit' });
  }
  let received = 0;
  req.on('data', chunk => {
    received += chunk.length;
    if (received > 100 * 1024 * 1024) req.destroy(new Error('Upload exceeds 100 MB limit'));
  });
  active = true;
  let released = false;
  const release = () => { if (!released) { released = true; active = false; } };
  // Release request capacity on completion or disconnect. Expensive renderers
  // also retain their own lock until their child process is closed.
  res.once('finish', release);
  res.once('close', release);
  // Controllers settle responses even for a disconnected socket.
  const originalEnd = res.end;
  res.end = function (...args) { release(); return originalEnd.apply(this, args); };
  next();
};
