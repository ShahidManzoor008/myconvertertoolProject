import fetch from 'node-fetch';
import { lookup } from 'node:dns/promises';
import http from 'node:http';
import https from 'node:https';
import ipaddr from 'ipaddr.js';

export const MAX_DOWNLOAD_BYTES = 20 * 1024 * 1024;
export const isPublicAddress = (address) => {
  try { return ipaddr.process(address).range() === 'unicast'; } catch { return false; }
};

// Require an explicit hostname allowlist. Pin the connection to a validated DNS
// result so redirects and DNS rebinding cannot reach private network services.
export async function downloadPublicFile(input) {
  const allowed = (process.env.ALLOWED_DOWNLOAD_DOMAINS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  let url = new URL(input);
  const signal = AbortSignal.timeout(15000);
  for (let hop = 0; hop < 4; hop++) {
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
        !allowed.includes(url.hostname.toLowerCase()) || (url.port && !['80', '443'].includes(url.port))) {
      throw new Error('Remote URL is not allowed. Upload converted files directly instead.');
    }
    const hostname = url.hostname.replace(/^\[|\]$/g, '');
    const addresses = await lookup(hostname, { all: true });
    if (!addresses.length || addresses.some(a => !isPublicAddress(a.address))) throw new Error('Remote address is not public');
    const selected = addresses[0];
    const Agent = url.protocol === 'https:' ? https.Agent : http.Agent;
    const agent = new Agent({ lookup: (_host, options, callback) => {
      if (options?.all) callback(null, [selected]);
      else callback(null, selected.address, selected.family);
    }});
    try {
      const response = await fetch(url, { agent, signal, redirect: 'manual', size: MAX_DOWNLOAD_BYTES });
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const target = response.headers.get('location');
        response.body.destroy();
        if (!target) throw new Error('Invalid download redirect');
        url = new URL(target, url);
        continue;
      }
      if (!response.ok) { response.body.destroy(); throw new Error('Remote download failed'); }
      if (Number(response.headers.get('content-length')) > MAX_DOWNLOAD_BYTES) {
        response.body.destroy(); throw new Error('Remote file exceeds download limit');
      }
      return await response.buffer();
    } finally { agent.destroy(); }
  }
  throw new Error('Too many download redirects');
}
