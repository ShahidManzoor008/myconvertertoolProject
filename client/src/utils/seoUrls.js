const SITE = 'https://myconvertertool.com';
export const absoluteUrl = value => { try { const url = new URL(value || '/', SITE); return ['https:', 'http:'].includes(url.protocol) ? url.href : SITE + '/'; } catch { return SITE + '/'; } };
