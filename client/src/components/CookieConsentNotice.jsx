import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { statsApi } from '../utils/apiClient';

const privatePaths = ['/login', '/register', '/profile'];
const toolRoutes = new Map([
  ['/tools/pdf-converter', 'pdf-converter'], ['/tools/file-compressor', 'file-compressor'],
  ['/tools/excel-pdf', 'excel-to-pdf'], ['/tools/markdown-to-docx', 'markdown-to-docx'],
  ['/tools/json-formatter', 'json-formatter'], ['/tools/base64-encoder', 'base64-encoder'],
  ['/tools/url-encoder', 'url-encoder'], ['/tools/minify-beautify', 'beautify-js'],
  ['/tools/qr-code-generator', 'qr-code-generator'], ['/tools/meta-tag-preview', 'meta-tag-preview'],
  ['/tools/text-case-converter', 'text-case-converter'], ['/tools/word-counter', 'word-counter'],
]);

function AnalyticsPageTracker() {
  const { pathname } = useLocation();
  useEffect(() => {
    const record = () => {
      if (privatePaths.some(path => pathname === path || pathname.startsWith(`${path}/`)) || pathname.startsWith('/admin')) return;
      const toolName = toolRoutes.get(pathname) || (pathname.startsWith('/tools/') ? 'tools' : pathname.startsWith('/blog') ? 'blog' : 'site');
      statsApi.recordVisit(toolName).catch(() => {});
    };
    record();
    window.addEventListener('myconvertertool:analytics-consent', record);
    return () => window.removeEventListener('myconvertertool:analytics-consent', record);
  }, [pathname]);
  return null;
}

export default function CookieConsentNotice() {
  const [choice, setChoice] = useState('loading');
  const [open, setOpen] = useState(false);
  const [manage, setManage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    statsApi.getAnalyticsConsent()
      .then(({ choice: currentChoice }) => { if (active) { setChoice(currentChoice || 'unset'); setOpen(!currentChoice); } })
      .catch(() => { if (active) { setChoice('unset'); setOpen(true); } });
    const showPreferences = () => { setOpen(true); setManage(true); };
    window.addEventListener('myconvertertool:cookie-settings', showPreferences);
    return () => { active = false; window.removeEventListener('myconvertertool:cookie-settings', showPreferences); };
  }, []);

  const saveChoice = async analytics => {
    setSaving(true); setError('');
    try {
      const result = await statsApi.setAnalyticsConsent(analytics);
      setChoice(result.analyticsAllowed ? 'accepted' : 'rejected');
      if (result.analyticsAllowed) window.dispatchEvent(new Event('myconvertertool:analytics-consent'));
      setOpen(false); setManage(false);
    } catch {
      setError('We could not save your choice. Please try again.');
    } finally { setSaving(false); }
  };

  return <>
    <AnalyticsPageTracker />
    {open && choice !== 'loading' && <section role="dialog" aria-labelledby="cookie-notice-title" aria-describedby="cookie-notice-description" className="fixed inset-x-3 bottom-3 z-[80] mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:inset-x-6 sm:bottom-6 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-xl">
          <h2 id="cookie-notice-title" className="text-base font-extrabold text-slate-900 dark:text-white">Cookie and privacy choices</h2>
          <p id="cookie-notice-description" className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Essential storage keeps your sign-in secure and remembers this choice. Optional analytics helps us understand tool usage and improve the site. You can use the tools if you decline.</p>
          <a href="/privacy-policy" className="mt-2 inline-block text-sm font-semibold text-blue-700 underline dark:text-blue-300">Read our Privacy Policy</a>
          {manage && <p className="mt-3 rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-600 dark:bg-slate-800 dark:text-slate-300">If enabled, we use a random first-party visitor ID to count unique anonymous visitors for up to 30 days and keep compact daily usage totals. Account-linked daily totals expire after 90 days. We do not put filenames or file contents in analytics.</p>}
          {error && <p role="alert" className="mt-2 text-sm font-semibold text-red-600">{error}</p>}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 sm:max-w-[15rem] sm:justify-end">
          <button type="button" disabled={saving} onClick={() => saveChoice(false)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">Reject optional</button>
          <button type="button" disabled={saving} onClick={() => saveChoice(true)} className="rounded-lg bg-blue-700 px-3 py-2 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-50">Accept analytics</button>
          {!manage && <button type="button" onClick={() => setManage(true)} className="w-full px-3 py-1 text-sm font-semibold text-blue-700 underline dark:text-blue-300">Manage preferences</button>}
          {manage && choice !== 'unset' && <button type="button" onClick={() => setOpen(false)} className="w-full px-3 py-1 text-sm font-semibold text-slate-600 underline dark:text-slate-300">Close</button>}
        </div>
      </div>
    </section>}
  </>;
}
