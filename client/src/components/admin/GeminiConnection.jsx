import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { apiClient } from '../../utils/apiClient';

const endpoint = '/api/ai-writer/provider';
const inputClass = 'mt-1 block min-h-11 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900';
const buttonClass = 'min-h-11 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold disabled:opacity-50 dark:border-slate-600';
export default function GeminiConnection({ provider, onChanged, onDirtyChange, onBusyChange, disabled }) {
  const [apiKey, setApiKey] = useState(''), [model, setModel] = useState(provider.model || ''), [billingMode, setBillingMode] = useState(provider.billingMode === 'paid' ? 'paid' : 'free');
  const [requestsEnabled, setRequestsEnabled] = useState(provider.requestsEnabled ?? provider.configured);
  const [revision, setRevision] = useState(provider.revision || 0);
  const [dirty, setDirty] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState(''), [test, setTest] = useState(null);
  useEffect(() => { onDirtyChange(dirty); }, [dirty, onDirtyChange]);
  useEffect(() => {
    if (dirty) return;
    setModel(provider.model || ''); setBillingMode(provider.billingMode === 'paid' ? 'paid' : 'free'); setRequestsEnabled(provider.requestsEnabled ?? provider.configured); setRevision(provider.revision || 0); setTest(null);
  }, [provider.model, provider.billingMode, provider.requestsEnabled, provider.configured, provider.revision, dirty]);
  const edit = setter => event => { setter(event.target.type === 'checkbox' ? event.target.checked : event.target.value); setDirty(true); setTest(null); setMessage(''); };
  const perform = async action => {
    setBusy(true); onBusyChange(true); setError(''); setMessage('');
    try { await action(); } catch (failure) { setError(failure.message); }
    finally { setBusy(false); onBusyChange(false); }
  };
  const save = event => {
    event.preventDefault();
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
  const checked = test || provider.lastTest;
  return <section aria-labelledby="gemini-connection-heading" className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-700 dark:bg-slate-800">
    <h2 id="gemini-connection-heading" className="text-lg font-semibold">Gemini connection</h2>
    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Add your Google AI Studio API key here. Saved keys are encrypted and never displayed again. A Google sign-in client ID is not an API key.</p>
    <p className="mt-2 text-xs text-slate-500">{provider.keyConfigured ? `Key connected${provider.keyFingerprint ? ` · fingerprint ${provider.keyFingerprint}` : ''}${provider.source === 'environment' ? ' · server environment' : ''}` : 'No API key connected.'}</p>
    {error && <p role="alert" className="mt-3 break-words text-sm text-red-700 dark:text-red-300">{error}</p>}
    {message && <p role="status" className="mt-3 text-sm text-blue-700 dark:text-blue-300">{message}</p>}
    <form onSubmit={save} className="mt-4"><fieldset disabled={busy || disabled} className="min-w-0 space-y-4">
      <label className="block text-sm font-medium">{provider.keyConfigured ? 'Replace Gemini API key (optional)' : 'Gemini API key'}<input className={inputClass} type="password" autoComplete="new-password" spellCheck={false} autoCapitalize="none" value={apiKey} onChange={edit(setApiKey)} maxLength={200} required={!provider.keyConfigured} placeholder={provider.keyConfigured ? 'Leave blank to keep the current key' : 'Paste your Gemini API key'} /><span className="mt-1 block text-xs font-normal text-slate-500">The key is sent only to this server and Google. It is not saved to browser storage.</span></label>
      <div className="grid min-w-0 gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Gemini model ID<input className={inputClass} required maxLength={100} value={model} onChange={edit(setModel)} placeholder="gemini-2.5-flash" spellCheck={false} autoCapitalize="none" /><span className="mt-1 block text-xs font-normal text-slate-500">Use a model available to your Google project. Test connection checks its compatibility.</span></label><label className="text-sm font-medium">Google project billing<select className={inputClass} value={billingMode} onChange={edit(setBillingMode)}><option value="free">Free quota project</option><option value="paid">Billing enabled project</option></select><span className="mt-1 block text-xs font-normal text-slate-500">This records your project setup; it does not change Google billing.</span></label></div>
      <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(requestsEnabled)} onChange={edit(setRequestsEnabled)} />Allow Gemini API writing</label>
      <p className="text-xs leading-5 text-slate-500">Saving does not start daily publishing. Connection checks query model access without generating text. Writing a test blog uses the normal generation API and may incur charges. Existing usage limits apply.</p>
      <div className="flex flex-wrap gap-3"><button type="submit" disabled={busy || disabled} className="min-h-11 rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Working…' : 'Save Gemini connection'}</button><button type="button" onClick={check} disabled={busy || disabled || dirty || !provider.canTest} className={buttonClass}>Test connection</button><button type="button" onClick={disconnect} disabled={busy || disabled || dirty || !provider.keyConfigured} className={buttonClass}>Disconnect Gemini</button>{dirty && <button type="button" className={buttonClass} disabled={busy || disabled} onClick={() => { setApiKey(''); setDirty(false); setError(''); setMessage(''); }}>Discard connection changes</button>}</div>
      {(dirty || disabled) && <p className="text-xs text-amber-700 dark:text-amber-300">{disabled ? 'Save or discard your editorial changes before managing the connection.' : 'Save or discard connection changes before testing or writing.'}</p>}
    </fieldset></form>
    {checked && <p role="status" className={`mt-4 rounded-lg p-3 text-sm ${checked.ok ? 'bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-200' : 'bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-200'}`}>{checked.message}{checked.checkedAt && <span className="mt-1 block text-xs">{new Date(checked.checkedAt).toLocaleString()} · {checked.latencyMs} ms</span>}</p>}
  </section>;
}
GeminiConnection.propTypes = {
  provider: PropTypes.object.isRequired, onChanged: PropTypes.func.isRequired,
  onDirtyChange: PropTypes.func.isRequired, onBusyChange: PropTypes.func.isRequired, disabled: PropTypes.bool,
};
