import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../utils/apiClient';
import GeminiConnection from '../../components/admin/GeminiConnection';

const endpoint = '/api/ai-writer';
const inputClass = 'mt-1 block min-h-11 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900';
const buttonClass = 'min-h-11 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold disabled:opacity-50 dark:border-slate-600';
const editable = ['enabled', 'paused', 'mode', 'articlesPerDay', 'timezone', 'hour', 'topics', 'instructions', 'excludedTopics', 'primaryDomains', 'monthlyRequestLimit', 'revision'];

export default function AIWriter() {
  const [data, setData] = useState(null), [form, setForm] = useState(null), [brief, setBrief] = useState('');
  const [error, setError] = useState(''), [message, setMessage] = useState(''), [busy, setBusy] = useState(false), [dirty, setDirty] = useState(false);
  const [providerDirty, setProviderDirty] = useState(false), [providerBusy, setProviderBusy] = useState(false);
  const [testId, setTestId] = useState(''), [testRun, setTestRun] = useState(null), [testError, setTestError] = useState('');
  const dirtyRef = useRef(false), busyRef = useRef(false);
  const refresh = async (reset = false) => {
    const result = await apiClient.get(endpoint);
    setData(result);
    if (reset || !dirtyRef.current) setForm(Object.fromEntries(editable.map(key => [key, result.settings[key]])));
    if (reset) { dirtyRef.current = false; setDirty(false); }
  };
  useEffect(() => {
    let disposed = false;
    const controller = new AbortController();
    const load = async () => {
      if (busyRef.current) return;
      try {
        const result = await apiClient.get(endpoint, { signal: controller.signal });
        if (disposed) return;
        setData(result);
        if (!dirtyRef.current) setForm(Object.fromEntries(editable.map(key => [key, result.settings[key]])));
      } catch (failure) { if (!disposed) setError(failure.message); }
    };
    load(); const timer = setInterval(load, 15000);
    return () => { disposed = true; controller.abort(); clearInterval(timer); };
  }, []);
  useEffect(() => {
    const warn = event => { if (dirty || providerDirty || brief) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn);
  }, [dirty, providerDirty, brief]);
  useEffect(() => {
    if (!testId) return;
    let disposed = false, timer;
    const controller = new AbortController();
    const update = async () => {
      try {
        const result = await apiClient.get(`${endpoint}/jobs/${testId}`, { signal: controller.signal });
        if (disposed) return;
        setTestRun(result); setTestError('');
        setData(current => current ? { ...current, jobs: [result, ...current.jobs.filter(job => job._id !== result._id)].slice(0, 30) } : current);
        if (!['queued', 'running'].includes(result.state)) {
          clearInterval(timer);
          try {
            const dashboard = await apiClient.get(endpoint, { signal: controller.signal });
            if (!disposed) setData(dashboard);
          } catch { /* Regular dashboard polling will refresh usage if this request fails. */ }
        }
      } catch { if (!disposed) setTestError('Could not refresh test progress. Retrying shortly; you can also check Recent runs.'); }
    };
    update(); timer = setInterval(update, 5000);
    return () => { disposed = true; clearInterval(timer); controller.abort(); };
  }, [testId]);
  const change = (key, value) => { dirtyRef.current = true; setDirty(true); setForm(current => ({ ...current, [key]: value })); };
  const perform = async action => {
    setBusy(true); busyRef.current = true; setError(''); setMessage('');
    try { await action(); }
    catch (failure) { setError(failure.message); }
    finally { setBusy(false); busyRef.current = false; }
  };
  const save = event => {
    event.preventDefault();
    perform(async () => {
      await apiClient.put(endpoint + '/settings', { ...form, primaryDomains: form.primaryDomains.map(domain => domain.trim().toLowerCase()).filter(Boolean) });
      await refresh(true); setMessage('Instructions and settings saved. Unfinished runs were cancelled so they cannot publish using older guidance.');
    });
  };
  const generate = event => {
    event.preventDefault();
    perform(async () => {
      const result = await apiClient.post(endpoint + '/generate', { brief });
      setBrief(''); setMessage(result.message); await refresh();
    });
  };
  const writeTest = () => perform(async () => {
    const result = await apiClient.post(endpoint + '/generate-test', { brief });
    setTestRun({ _id: result.id, state: 'queued', reasons: [] }); setTestId(result.id); setTestError('');
    setBrief(''); setMessage(result.message); await refresh();
  });
  return <div className="min-w-0 space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-semibold text-blue-700 dark:text-blue-300">Blog publishing</p><h1 className="mt-1 text-2xl font-semibold">AI Writer</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">You set the direction. The writer researches current sources, creates Markdown articles and follows your publishing rules.</p></div><Link to="/admin/posts" className={buttonClass}>View blog posts</Link></header>
    {error && <p role="alert" className="break-words rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">{error} {!data && <button onClick={() => perform(() => refresh(true))} disabled={busy} className="ml-2 underline">Retry</button>}</p>}
    {message && <p role="status" className="rounded-lg bg-blue-50 p-4 text-sm text-blue-900 dark:bg-blue-950/40 dark:text-blue-200">{message}</p>}
    {!data || !form ? <p role="status">Loading writer settings…</p> : <>
      <GeminiConnection provider={data.provider} onChanged={() => refresh(true)} onDirtyChange={setProviderDirty} onBusyChange={setProviderBusy} disabled={busy || dirty} />
      <section aria-label="Verify AI writing" className="rounded-xl border border-blue-200 bg-blue-50 p-4 sm:p-6 dark:border-blue-900 dark:bg-blue-950/30">
        <h2 className="text-lg font-semibold">Write a test blog</h2><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">Try the complete workflow with one click. It uses your saved instructions and optional one-time brief below, then saves a private draft even if automatic publishing is enabled. No daily schedule is needed.</p>
        <button type="button" onClick={writeTest} className="mt-4 min-h-11 rounded-lg bg-blue-700 px-5 text-sm font-semibold text-white disabled:opacity-50" disabled={busy || providerBusy || dirty || providerDirty || data.settings.paused || !data.provider.configured || ['queued', 'running'].includes(testRun?.state)}>Write test blog</button>
        <p className="mt-2 text-xs text-slate-500">Up to two test attempts per UTC day, separate from your daily article slots. They share the monthly API request limit and may incur Google charges. Save any connection or instruction changes first.</p>
        {data.settings.paused && <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">The writer is paused. Resume it in your saved settings before writing a test.</p>}
        {!data.provider.configured && <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">Save a Gemini connection with “Allow Gemini API writing” enabled before writing a test.</p>}
        {testRun && <div role="status" className="mt-4 rounded-lg bg-white p-4 text-sm dark:bg-slate-900"><p className="font-semibold">{testRun.state === 'draft' ? 'Test draft ready' : testRun.state === 'running' ? 'Researching and writing your test blog…' : testRun.state === 'queued' ? 'Waiting for the writer…' : testRun.state === 'cancelled' ? 'Test cancelled' : 'Test did not finish'}</p>{testRun.article?.title && <p className="mt-2">{testRun.article.title}</p>}{testRun.article?.excerpt && <p className="mt-2 text-slate-500">{testRun.article.excerpt}</p>}{testRun.article?.slug && <Link to={`/admin/posts/${testRun.article.slug}/edit`} className="mt-3 inline-flex min-h-11 items-center font-semibold text-blue-700 underline dark:text-blue-300">Open test draft</Link>}{!!testRun.reasons?.length && <ul className="mt-2 space-y-1">{testRun.reasons.map((reason, index) => <li key={index} className="break-words">{reason}</li>)}</ul>}</div>}
        {testError && <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">{testError}</p>}
      </section>
      <section aria-label="Writer status" className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3"><p className="font-semibold">{data.settings.paused ? 'Paused' : data.settings.enabled ? 'Daily schedule enabled' : 'Manual generation only'}</p><button type="button" className={buttonClass} disabled={busy || data.settings.paused} onClick={() => perform(async () => { await apiClient.post(endpoint + '/pause', {}); await refresh(true); setMessage('Writer paused. Unfinished runs were cancelled.'); })}>Pause all writing</button></div>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{data.provider.message}</p>
        <p className="mt-2 text-sm">This month (UTC): <strong>{data.usage.requests}</strong> API requests · {data.usage.tokens.toLocaleString()} tokens</p>
        <p className="mt-2 text-xs text-slate-500">Request ceiling: {Math.min(data.settings.monthlyRequestLimit, data.serverMonthlyRequestLimit)} per month. Failed requests count. This is a usage limit, not a dollar budget; set billing and quotas in your Google project. Current billing mode: {data.provider.billingMode}.</p>
      </section>
      <form onSubmit={save} className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-700 dark:bg-slate-800"><fieldset disabled={busy || providerBusy} className="min-w-0 space-y-5">
        <div><h2 className="text-lg font-semibold">Your editorial instructions</h2><p className="mt-1 text-sm text-slate-500">These apply to every run. Saving any change cancels queued and unfinished work. Review any unsaved one-time brief before leaving this page.</p></div>
        <label className="block text-sm font-medium">Topics to cover<textarea className={inputClass} rows={2} maxLength={2000} required value={form.topics} onChange={event => change('topics', event.target.value)} placeholder="AI launches, useful developer tools, document automation…" /></label>
        <label className="block text-sm font-medium">Standing instructions<textarea className={inputClass} rows={7} maxLength={12000} value={form.instructions} onChange={event => change('instructions', event.target.value)} placeholder="Audience, writing style, priorities, required sections and anything the writer should pay attention to…" /><span className="mt-1 block text-xs font-normal text-slate-500">Examples: Explain technical terms simply. Focus on free tools. Include practical limitations. Avoid promotional language. Instructions cannot bypass source checks, quotas or publishing controls.</span></label>
        <label className="block text-sm font-medium">Topics or content to avoid<textarea className={inputClass} rows={2} maxLength={2000} value={form.excludedTopics} onChange={event => change('excludedTopics', event.target.value)} /></label>
        <div className="grid min-w-0 gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium">Publishing mode<select className={inputClass} value={form.mode} onChange={event => change('mode', event.target.value)}><option value="draft">Save drafts for admin review</option><option value="auto">Auto-publish only passing articles</option></select></label>
          <label className="text-sm font-medium">Daily generation attempts<select className={inputClass} value={form.articlesPerDay} onChange={event => change('articlesPerDay', Number(event.target.value))}>{[1, 2, 3].map(count => <option key={count} value={count}>{count} per day</option>)}</select></label>
          <label className="text-sm font-medium">Timezone<input className={inputClass} required maxLength={80} value={form.timezone} onChange={event => change('timezone', event.target.value)} list="writer-timezones" /><datalist id="writer-timezones"><option value="UTC" /><option value="Asia/Karachi" /><option value="America/New_York" /><option value="Europe/London" /></datalist></label>
          <label className="text-sm font-medium">Start hour (local time)<select className={inputClass} value={form.hour} onChange={event => change('hour', Number(event.target.value))}>{Array.from({ length: 24 }, (_, hour) => <option key={hour} value={hour}>{String(hour).padStart(2, '0')}:00</option>)}</select></label>
          <label className="text-sm font-medium">Monthly API request limit<input className={inputClass} type="number" min={2} max={1000} required value={form.monthlyRequestLimit} onChange={event => change('monthlyRequestLimit', Number(event.target.value))} /></label>
          <label className="text-sm font-medium">Primary-source domains<textarea className={inputClass} rows={3} required value={form.primaryDomains.join('\n')} onChange={event => change('primaryDomains', event.target.value.split('\n'))} /><span className="text-xs font-normal text-slate-500">One hostname per line, for example blog.google. At least one publisher source must match for auto-publication.</span></label>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-3"><label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={form.enabled} disabled={!data.provider.configured} onChange={event => change('enabled', event.target.checked)} />Enable daily schedule</label><label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={form.paused} onChange={event => change('paused', event.target.checked)} />Pause all writing</label></div>
        <p className="text-xs leading-5 text-slate-500">The writer checks every minute and runs sequentially after the start hour. Manual runs use the same daily slots. Failed and cancelled attempts consume a slot. At most three attempts per UTC day, including timezone changes. Automatic checks can miss errors; human review is recommended for new configurations.</p>
        <div className="flex flex-wrap items-center gap-3"><button disabled={busy} type="submit" className="min-h-11 rounded-lg bg-blue-700 px-5 text-sm font-semibold text-white disabled:opacity-50">Save instructions & settings</button>{dirty && <><span className="text-sm text-amber-700 dark:text-amber-300">Unsaved changes</span><button type="button" className={buttonClass} disabled={busy} onClick={() => perform(() => refresh(true))}>Discard changes</button></>}</div>
      </fieldset></form>
      <form onSubmit={generate} className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-700 dark:bg-slate-800"><h2 className="text-lg font-semibold">Give the writer a brief</h2><p className="mt-1 text-sm text-slate-500">Optional instructions for this article only. Saved guidance and the selected publishing mode still apply.</p><label className="mt-4 block text-sm font-medium">One-time article instructions<textarea className={inputClass} maxLength={6000} rows={4} value={brief} onChange={event => setBrief(event.target.value)} placeholder="Example: Find a recent AI development that helps students work with documents. Explain what is free and what is paid." /></label><button type="submit" className="mt-4 min-h-11 rounded-lg bg-blue-700 px-5 text-sm font-semibold text-white disabled:opacity-50" disabled={busy || providerBusy || providerDirty || dirty || data.settings.paused || !data.provider.configured}>Generate now</button>{dirty && <p className="mt-2 text-xs text-amber-700">Save or discard your settings changes before generating.</p>}</form>
      <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-700 dark:bg-slate-800" aria-labelledby="writer-history"><div className="flex flex-wrap items-center justify-between gap-3"><h2 id="writer-history" className="text-lg font-semibold">Recent runs</h2><button className={buttonClass} disabled={busy} onClick={() => perform(async () => { const result = await apiClient.post(endpoint + '/history/cleanup', {}); await refresh(); setMessage(`${result.removed} completed summaries older than seven days removed. Articles were kept.`); })}>Clean old history</button></div><p className="mt-2 text-xs text-slate-500">Completed run summaries expire after 30 days. Articles and their sources remain available.</p>
        {!data.jobs.length ? <p className="py-6 text-sm text-slate-500">No runs yet. Configure the provider, save your instructions and generate your first draft.</p> : <ul className="mt-4 divide-y divide-slate-200 dark:divide-slate-700">{data.jobs.map(job => <li key={job._id} className="min-w-0 py-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold capitalize">{job.state} <span className="font-normal text-slate-500">· {job.trigger} · {new Date(job.createdAt).toLocaleString()}</span></p>{['queued', 'running'].includes(job.state) && <button disabled={busy} className={buttonClass} onClick={() => perform(async () => { await apiClient.post(`${endpoint}/jobs/${job._id}/cancel`, {}); await refresh(); setMessage('Run cancelled.'); })}>Cancel run</button>}</div>{job.article?.slug && <Link className="mt-2 inline-flex min-h-11 items-center break-words text-sm font-semibold text-blue-700 underline dark:text-blue-300" to={`/admin/posts/${job.article.slug}/edit`}>{job.article.title} · Edit article</Link>}{!!job.reasons?.length && <ul className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-400">{job.reasons.map((reason, index) => <li className="break-words" key={index}>{reason}</li>)}</ul>}<p className="mt-2 text-xs text-slate-500">{job.usage?.requests || 0} requests · {job.usage?.tokens || 0} tokens</p></li>)}</ul>}
      </section>
    </>}
  </div>;
}
