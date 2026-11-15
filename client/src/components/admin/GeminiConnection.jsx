import { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { apiClient } from '../../utils/apiClient';

const endpoint = '/api/ai-writer/provider';
const inputClass = 'mt-1 block min-h-11 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900';
const buttonClass = 'min-h-11 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold disabled:opacity-50 dark:border-slate-600';
export default function GeminiConnection({ provider, onChanged, onDirtyChange, onBusyChange, disabled }) {
  const [apiKey, setApiKey] = useState(''), [model, setModel] = useState(provider.model || ''), [billingMode, setBillingMode] = useState(provider.billingMode === 'paid' ? 'paid' : 'free');
  const [requestsEnabled, setRequestsEnabled] = useState(provider.requestsEnabled ?? provider.configured), [revision, setRevision] = useState(provider.revision || 0);
  const [dirty, setDirty] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState(''), [test, setTest] = useState(null);
  const [catalog, setCatalog] = useState(null), [modelsLoading, setModelsLoading] = useState(false), [modelsError, setModelsError] = useState('');
  const requestSerial = useRef(0), modelAbort = useRef(null);
  const canDiscover = /^[A-Za-z0-9_.-]{20,200}$/.test(apiKey.trim()) || (!apiKey.trim() && provider.keyConfigured);
  useEffect(() => { onDirtyChange(dirty); }, [dirty, onDirtyChange]);
  useEffect(() => {
    if (dirty) return;
    setModel(provider.model || ''); setBillingMode(provider.billingMode === 'paid' ? 'paid' : 'free'); setRequestsEnabled(provider.requestsEnabled ?? provider.configured); setRevision(provider.revision || 0); setTest(null);
  }, [provider.model, provider.billingMode, provider.requestsEnabled, provider.configured, provider.revision, dirty]);
  const loadModels = useCallback(async (refresh = false) => {
    if (!(/^[A-Za-z0-9_.-]{20,200}$/.test(apiKey.trim()) || (!apiKey.trim() && provider.keyConfigured))) return;
    modelAbort.current?.abort();
    const controller = new AbortController(); modelAbort.current = controller;
    const serial = ++requestSerial.current;
    setModelsLoading(true); setModelsError('');
    try {
      const result = await apiClient.post(endpoint + '/models', { ...(apiKey.trim() ? { apiKey: apiKey.trim() } : {}), refresh }, { signal: controller.signal });
      if (controller.signal.aborted || serial !== requestSerial.current) return;
      if (!Array.isArray(result.models)) throw new Error('Google returned no usable model list. Try Refresh models.');
      setCatalog(result);
    } catch (failure) { if (!controller.signal.aborted && serial === requestSerial.current) setModelsError(failure.message); }
    finally { if (!controller.signal.aborted && serial === requestSerial.current) setModelsLoading(false); }
  }, [apiKey, provider.keyConfigured]);
  useEffect(() => {
    modelAbort.current?.abort(); ++requestSerial.current; setCatalog(null); setModelsError(''); setModelsLoading(false);
    const timer = setTimeout(() => { loadModels(); }, apiKey ? 800 : 0);
    return () => { clearTimeout(timer); modelAbort.current?.abort(); };
  }, [loadModels, apiKey, provider.keyFingerprint, provider.revision]);
  const edit = setter => event => { setter(event.target.type === 'checkbox' ? event.target.checked : event.target.value); setDirty(true); setTest(null); setMessage(''); };
  const editKey = event => { modelAbort.current?.abort(); ++requestSerial.current; setCatalog(null); setModelsLoading(false); setModelsError(''); edit(setApiKey)(event); };
  const perform = async action => {
    setBusy(true); onBusyChange(true); setError(''); setMessage('');
    try { await action(); } catch (failure) { setError(failure.message); }
    finally { setBusy(false); onBusyChange(false); }
  };
  const compatible = (catalog?.models || []).filter(item => item.compatible), otherModels = (catalog?.models || []).filter(item => !item.compatible);
  const selected = catalog?.models.find(item => item.id === model);
  const selectionValid = catalog ? !!selected?.compatible : (!apiKey.trim() && provider.keyConfigured && model === provider.model);
  const save = event => {
    event.preventDefault();
    if (!selectionValid || modelsLoading) return;
    perform(async () => {
      await apiClient.put(endpoint, { apiKey, model: model.trim(), billingMode, requestsEnabled, revision });
      setApiKey(''); setDirty(false); setTest(null);
      await onChanged(); setMessage('Gemini connection saved. The daily schedule is off and unfinished runs were cancelled. Test the connection before enabling your schedule.');
    });
  };
  const check = () => perform(async () => { const result = await apiClient.post(endpoint + '/test', {}); setTest(result); await onChanged(); });
  const disconnect = () => {
    if (!window.confirm('Disconnect Gemini and cancel unfinished runs? You will need to enter an API key again to reconnect.')) return;
    perform(async () => { await apiClient.post(endpoint + '/disconnect', { revision }); setApiKey(''); setDirty(false); setTest(null); await onChanged(); setMessage('Gemini disconnected. API writing and the daily schedule are disabled.'); });
  };
  const checked = dirty ? null : test || provider.lastTest;
  return <section aria-labelledby="gemini-connection-heading" className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-700 dark:bg-slate-800">
    <h2 id="gemini-connection-heading" className="text-lg font-semibold">Gemini connection</h2>
    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Add your Google AI Studio API key. Standard keys and AQ. authorization keys are supported. Saved keys are encrypted and never displayed again.</p>
    <p className="mt-2 text-xs text-slate-500">{provider.keyConfigured ? `Key connected${provider.keyFingerprint ? ` · fingerprint ${provider.keyFingerprint}` : ''}${provider.source === 'environment' ? ' · server environment' : ''}` : 'No API key connected.'}</p>
    {error && <p role="alert" className="mt-3 break-words text-sm text-red-700 dark:text-red-300">{error}</p>}
    {message && <p role="status" className="mt-3 text-sm text-blue-700 dark:text-blue-300">{message}</p>}
    <form onSubmit={save} className="mt-4"><fieldset disabled={busy || disabled} className="min-w-0 space-y-4">
      <div><label className="block text-sm font-medium">{provider.keyConfigured ? 'Replace Gemini API key (optional)' : 'Gemini API key'}<input className={inputClass} type="password" autoComplete="new-password" spellCheck={false} autoCapitalize="none" aria-describedby="gemini-key-help" value={apiKey} onChange={editKey} maxLength={200} required={!provider.keyConfigured} placeholder={provider.keyConfigured ? 'Leave blank to keep the current key' : 'Paste your Gemini API key'} /></label><p id="gemini-key-help" className="mt-1 text-xs text-slate-500">Models load automatically after you enter a key. Discovery does not save the key or generate text. A Google login client ID is not an API key.</p></div>
      <div className="min-w-0"><div className="flex flex-wrap items-end justify-between gap-3"><label htmlFor="gemini-model" className="text-sm font-medium">Gemini model ID</label><button type="button" onClick={() => loadModels(true)} disabled={modelsLoading || !canDiscover} className={buttonClass}>{modelsLoading ? 'Loading models…' : 'Refresh models'}</button></div><select id="gemini-model" className={inputClass} required value={model} onChange={edit(setModel)}><option value="">Select a blog-writing model</option>{model && !catalog?.models.some(item => item.id === model) && <option value={model}>{model} · current selection</option>}<optgroup label="Blog-writing models">{compatible.map(item => <option key={item.id} value={item.id}>{item.displayName} ({item.id})</option>)}</optgroup>{!!otherModels.length && <optgroup label="Other available models — unsupported for blog writing">{otherModels.map(item => <option key={item.id} value={item.id} disabled>{item.displayName} ({item.id}) · {item.reason}</option>)}</optgroup>}</select>
        {modelsLoading && <p role="status" className="mt-2 text-xs text-slate-500">Fetching models from Google…</p>}
        {modelsError && <p role="alert" className="mt-2 break-words text-sm text-red-700 dark:text-red-300">{modelsError}</p>}
        {catalog && <p className="mt-2 text-xs leading-5 text-slate-500">{catalog.models.length} models returned · {compatible.length} suitable for the blog writer · {catalog.fromCache ? 'Cached' : 'Updated'} {new Date(catalog.fetchedAt).toLocaleString()}. Model listing does not confirm generation quota or free-tier access.</p>}
        {selected && <p className="mt-2 text-xs text-slate-500">Context limits per request: {selected.inputTokenLimit?.toLocaleString() || 'unknown'} input tokens · {selected.outputTokenLimit?.toLocaleString() || 'unknown'} output tokens.</p>}
        {catalog && !compatible.length && <p className="mt-2 text-sm text-amber-700">No compatible blog-writing model was returned for this key.</p>}
      </div>
      <label className="block text-sm font-medium">Google project billing<select className={inputClass} value={billingMode} onChange={edit(setBillingMode)}><option value="free">Free quota project</option><option value="paid">Billing enabled project</option></select><span className="mt-1 block text-xs font-normal text-slate-500">This records your project setup; it does not change Google billing.</span></label>
      <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(requestsEnabled)} onChange={edit(setRequestsEnabled)} />Allow Gemini API writing</label>
      <p className="text-xs leading-5 text-slate-500">Saving does not start daily publishing. Model discovery and connection checks count toward the portal API request limit without generating text. Test blogs use the generation API and may incur charges.</p>
      <div className="flex flex-wrap gap-3"><button type="submit" disabled={busy || disabled || modelsLoading || !selectionValid} className="min-h-11 rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Working…' : 'Save Gemini connection'}</button><button type="button" onClick={check} disabled={busy || disabled || dirty || !provider.canTest} className={buttonClass}>Test connection</button><button type="button" onClick={disconnect} disabled={busy || disabled || dirty || !provider.keyConfigured} className={buttonClass}>Disconnect Gemini</button>{dirty && <button type="button" className={buttonClass} disabled={busy || disabled} onClick={() => { setApiKey(''); setDirty(false); setError(''); setMessage(''); }}>Discard connection changes</button>}</div>
      {(dirty || disabled) && <p className="text-xs text-amber-700 dark:text-amber-300">{disabled ? 'Save or discard your editorial changes before managing the connection.' : 'Save or discard connection changes before testing or writing.'}</p>}
    </fieldset></form>
    {checked && <p role="status" className={`mt-4 rounded-lg p-3 text-sm ${checked.ok ? 'bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-200' : 'bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-200'}`}>{checked.message}{checked.checkedAt && <span className="mt-1 block text-xs">{new Date(checked.checkedAt).toLocaleString()} · {checked.latencyMs} ms</span>}</p>}
  </section>;
}
GeminiConnection.propTypes = { provider: PropTypes.object.isRequired, onChanged: PropTypes.func.isRequired, onDirtyChange: PropTypes.func.isRequired, onBusyChange: PropTypes.func.isRequired, disabled: PropTypes.bool };
