import { realpathSync } from 'node:fs';

// A candidate must not consume scheduled work before Nginx routes traffic to it.
export function isActiveRelease(env = process.env) {
  if (!env.DEPLOY_ACTIVE_LINK && !env.DEPLOY_RELEASE_DIR) return true;
  if (!env.DEPLOY_ACTIVE_LINK || !env.DEPLOY_RELEASE_DIR) return false;
  try { return realpathSync(env.DEPLOY_ACTIVE_LINK) === realpathSync(env.DEPLOY_RELEASE_DIR); }
  catch { return false; }
}

export function readinessHandler({ connection, checkBuild, env = process.env, isStopping = () => false }) {
  return async (_req, res) => {
    res.set('Cache-Control', 'no-store').set('X-Robots-Tag', 'noindex');
    try {
      if (isStopping() || connection.readyState !== 1) throw new Error('Unavailable');
      await Promise.all([
        connection.db.command({ ping: 1 }, { timeoutMS: 1500 }),
        checkBuild(),
      ]);
      res.json({ status: 'ready', release: env.DEPLOY_RELEASE_ID || 'unmanaged' });
    } catch {
      res.status(503).json({ status: 'unavailable' });
    }
  };
}
