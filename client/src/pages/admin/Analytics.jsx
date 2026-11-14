import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminApi } from '../../utils/apiClient';
import LoadingSpinner from '../../components/LoadingSpinner';

const number = value => typeof value === 'number' ? value.toLocaleString() : (value || '0');
const bytes = value => value == null ? 'Unavailable' : `${(Number(value) / (1024 * 1024)).toFixed(0)} MB`;
const reasonLabels = {
  timeout: 'Timed out', 'invalid-file': 'Invalid or unsupported file', 'invalid-input': 'Invalid input',
  'service-unavailable': 'Conversion service unavailable', 'resource-limit': 'Resource limit',
  'conversion-error': 'Other conversion error', none: 'No error',
};

const Analytics = () => {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [cleanup, setCleanup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [analytics, preview] = await Promise.all([adminApi.getAnalytics(days), adminApi.getCleanupPreview()]);
      setData(analytics); setCleanup(preview);
    } catch { setError('Analytics could not be loaded. Check your admin session and try again.'); }
    finally { setLoading(false); }
  }, [days]);

  useEffect(() => { load(); }, [load]);

  const totals = useMemo(() => (data?.byTool || []).reduce((result, row) => ({
    success: result.success + row.successes,
    failure: result.failure + row.failures,
  }), { success: 0, failure: 0 }), [data]);
  const toolStats = useMemo(() => {
    const rows = new Map();
    for (const row of data?.byTool || []) rows.set(row._id, { _id: row._id, successes: row.successes || 0, failures: row.failures || 0, opens: 0 });
    for (const row of data?.pageViews || []) {
      const item = rows.get(row._id) || { _id: row._id, successes: 0, failures: 0, opens: 0 };
      item.opens = row.count || 0; rows.set(row._id, item);
    }
    return [...rows.values()].sort((a, b) => (b.successes + b.failures + b.opens) - (a.successes + a.failures + a.opens)).slice(0, 20);
  }, [data]);

  const runCleanup = async () => {
    if (!window.confirm('Remove expired detailed records and stale top-level temporary upload files? Long-term aggregate analytics will be kept.')) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const result = await adminApi.runCleanup();
      const { removed } = result;
      setMessage(`Cleanup complete: ${number(removed.legacyConversionLogs)} old logs, ${number(removed.temporaryFiles)} temp files (${(removed.temporaryBytes / 1024 / 1024).toFixed(1)} MB), and expired visitor/account markers removed.`);
      await load();
    } catch { setError('Cleanup did not complete. Review server status and retry.'); }
    finally { setBusy(false); }
  };

  if (loading && !data) return <LoadingSpinner message="Loading analytics and cleanup status…" />;

  return <div className="mx-auto max-w-6xl space-y-6 py-2">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div><h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">Usage analytics</h1><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Compact, consent-aware usage totals. No filenames or file contents are stored in new analytics.</p></div>
      <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Date range <select value={days} onChange={event => setDays(Number(event.target.value))} className="ml-2 rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-800"><option value={7}>7 days</option><option value={30}>30 days</option><option value={90}>90 days</option></select></label>
    </div>

    {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
    {message && <p role="status" className="rounded-xl bg-green-50 p-4 text-sm font-semibold text-green-800 dark:bg-green-950/40 dark:text-green-300">{message}</p>}

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5" aria-label="Usage summary">
      {[
        ['Successful conversions', totals.success, 'text-green-700 dark:text-green-300'],
        ['Failed conversions', totals.failure, 'text-red-700 dark:text-red-300'],
        ['Conversion success rate', totals.success + totals.failure ? `${(totals.success / (totals.success + totals.failure) * 100).toFixed(1)}%` : '—', 'text-emerald-700 dark:text-emerald-300'],
        ['Consented anonymous browsers (30d)', data?.anonymousUniqueVisitors, 'text-blue-700 dark:text-blue-300'],
        ['Active registered users', data?.activeRegisteredUsers, 'text-violet-700 dark:text-violet-300'],
      ].map(([label, value, color]) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800"><p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</p><p className={`mt-2 text-3xl font-black ${color}`}>{number(value)}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{label.includes('(30d)') ? 'Rolling 30-day window; opt-in analytics only' : `Selected ${days}-day range`}</p></div>)}
    </section>

    <section className="grid gap-6 xl:grid-cols-2">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="border-b border-slate-200 p-5 dark:border-slate-700"><h2 className="font-extrabold text-slate-900 dark:text-white">Most-used tools</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Conversions and page opens are counted separately.</p></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[32rem] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-900/50 dark:text-slate-400"><tr><th className="px-5 py-3">Tool</th><th className="px-5 py-3">Success</th><th className="px-5 py-3">Failed</th><th className="px-5 py-3">Opens</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-700">{toolStats.map(row => <tr key={row._id}><th className="px-5 py-3 font-semibold text-slate-800 dark:text-slate-200">{row._id}</th><td className="px-5 py-3 text-green-700 dark:text-green-300">{number(row.successes)}</td><td className="px-5 py-3 text-red-700 dark:text-red-300">{number(row.failures)}</td><td className="px-5 py-3">{number(row.opens)}</td></tr>)}{!toolStats.length && <tr><td colSpan="4" className="px-5 py-8 text-center text-slate-500">No tool activity in this range yet.</td></tr>}</tbody></table></div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="border-b border-slate-200 p-5 dark:border-slate-700"><h2 className="font-extrabold text-slate-900 dark:text-white">Common failure reasons</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Error details are reduced to these categories.</p></div>
        <ul className="divide-y divide-slate-100 dark:divide-slate-700">{(data?.failuresByReason || []).map(row => <li key={row._id} className="flex items-center justify-between gap-4 px-5 py-4"><span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{reasonLabels[row._id] || 'Other conversion error'}</span><span className="rounded-full bg-red-50 px-3 py-1 text-sm font-bold text-red-700 dark:bg-red-950/50 dark:text-red-300">{number(row.count)}</span></li>)}{!data?.failuresByReason?.length && <li className="px-5 py-8 text-center text-sm text-slate-500">No failed conversions recorded in this range.</li>}</ul>
      </div>
    </section>

    <section className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 dark:border-amber-900/60 dark:bg-amber-950/20 sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div><h2 className="font-extrabold text-slate-900 dark:text-white">Analytics and temporary-file cleanup</h2><p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">Preview counts include legacy conversion records older than 90 days, expired account and anonymous markers, and app-owned temporary uploads or conversion work folders older than 6 hours. Blog images and long-term aggregate totals are retained. System logs are managed separately by server log rotation.</p>
          <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">{cleanup ? `${number(cleanup.legacyConversionLogs)} old logs · ${number(cleanup.accountDailyRollups)} account rollups · ${number(cleanup.anonymousVisitorMarkers)} visitor markers · ${number(cleanup.temporaryFiles)} temporary files · ${(cleanup.temporaryBytes / 1024 / 1024).toFixed(1)} MB` : 'Cleanup preview unavailable.'}</p>
        </div>
        <button type="button" onClick={runCleanup} disabled={busy || !cleanup} className="shrink-0 rounded-xl bg-amber-700 px-5 py-3 text-sm font-extrabold text-white hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-50">{busy ? 'Cleaning…' : 'Clean expired data'}</button>
      </div>
      <div className="mt-5 grid gap-3 border-t border-amber-200 pt-5 dark:border-amber-900/60 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ['Database', cleanup?.system?.database || 'Unknown'],
          ['Converter', cleanup?.system?.conversionCapacity?.active ? 'Busy (1 slot)' : 'Ready (1 slot)'],
          ['Process memory', bytes(cleanup?.system?.processRssBytes)],
          ['Host memory free', bytes(cleanup?.system?.systemMemoryFreeBytes)],
          ['Disk free', cleanup?.system?.diskFreeBytes == null ? 'Unavailable' : `${bytes(cleanup.system.diskFreeBytes)} / ${bytes(cleanup.system.diskTotalBytes)}`],
        ].map(([label, value]) => <div key={label} className="rounded-xl bg-white/80 p-3 dark:bg-slate-900/60"><p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</p><p className="mt-1 text-sm font-extrabold text-slate-800 dark:text-slate-100">{value}</p></div>)}
      </div>
    </section>
  </div>;
};

export default Analytics;
